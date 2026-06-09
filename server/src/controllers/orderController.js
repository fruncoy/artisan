import { db } from '../firebase/admin.js'
import { emailService } from '../services/emailService.js'

export async function placeOrder(req, res) {
  const { items, shipping = 0 } = req.body
  const customerId = req.user.uid
  const customerEmail = req.user.email

  if (!items || !items.length) return res.status(400).json({ message: 'Cart is empty' })

  try {
    // 1. Identify all docs we need to touch outside the transaction
    const productIds = [...new Set(items.map(i => i.id))].filter(Boolean)
    const productRefs = productIds.map(id => db.collection('products').doc(id))
    
    // Pre-read products to find artisan IDs
    const tempSnaps = await Promise.all(productRefs.map(r => r.get()))
    const artisanIds = new Set()
    tempSnaps.forEach(s => { if (s.exists && s.data().artisanId) artisanIds.add(s.data().artisanId) })

    // 2. Prepare ALL references OUTSIDE the transaction to avoid implicit reads
    const customerRef = db.collection('users').doc(customerId)
    const artisanRefs = Array.from(artisanIds).map(id => db.collection('users').doc(id))
    
    // Pre-generate references for new documents
    const orderRef = db.collection('orders').doc()
    
    // Create a unique set of all references to read at the start of transaction
    const allRefsMap = new Map()
    allRefsMap.set(customerRef.path, customerRef)
    productRefs.forEach(ref => allRefsMap.set(ref.path, ref))
    artisanRefs.forEach(ref => allRefsMap.set(ref.path, ref))
    
    const uniqueRefs = Array.from(allRefsMap.values())

    // 3. START THE TRANSACTION
    await db.runTransaction(async (t) => {
      // --- PHASE 1: ALL READS AT THE TOP ---
      // We must execute all reads before any writes in a Firestore transaction
      const allSnaps = await t.getAll(...uniqueRefs)
      
      const snapsMap = new Map()
      allSnaps.forEach(snap => { 
        if (snap && snap.exists) {
          // Use full path as key to avoid collisions between different collections
          snapsMap.set(snap.ref.path, snap.data()) 
        }
      })

      // --- PHASE 2: LOGIC (No Firestore reads allowed after this point) ---
      const customerData = snapsMap.get(customerRef.path)
      if (!customerData) throw new Error('Customer profile not found')

      let subtotal = 0
      const artisanEarnings = {}
      const verifiedItems = []

      for (const item of items) {
        // Construct the expected product path to look up in our pre-read data
        const productPath = db.collection('products').doc(item.id).path
        const pData = snapsMap.get(productPath)
        
        if (!pData) throw new Error(`Product ${item.id} not found or unavailable`)
        
        const price = Number(pData.price) || 0
        const qty = Number(item.quantity) || 1
        const aId = pData.artisanId

        verifiedItems.push({ 
          id: item.id, 
          name: pData.name, 
          price, 
          quantity: qty, 
          artisanId: aId,
          imageUrl: pData.imageUrl
        })
        subtotal += price * qty
        if (aId) {
          artisanEarnings[aId] = (artisanEarnings[aId] || 0) + (price * qty)
        }
      }

      const totalAmount = subtotal + Number(shipping)
      const balance = Number(customerData.walletBalance) || 0
      
      if (balance < totalAmount) {
        throw new Error(`Insufficient funds: KES ${totalAmount} required, but your wallet has KES ${balance}`)
      }

      // --- PHASE 3: ALL WRITES ---
      // All t.set(), t.update(), and t.delete() calls must come after all reads
      
      // 1. Update Customer Balance
      t.update(customerRef, { 
        walletBalance: balance - totalAmount, 
        updatedAt: new Date().toISOString() 
      })

      // 2. Create Order Document
      const finalArtisanIds = Object.keys(artisanEarnings)
      t.set(orderRef, {
        id: orderRef.id,
        customerId,
        customerEmail,
        customerName: customerData.displayName || 'Customer',
        customerLocation: customerData.location || 'Not Set',
        items: verifiedItems,
        total: totalAmount,
        status: 'placed',
        artisanIds: finalArtisanIds,
        createdAt: new Date().toISOString()
      })

      // 3. Record Customer Transaction (Debit)
      const custTransRef = db.collection('transactions').doc()
      t.set(custTransRef, { 
        userId: customerId, 
        amount: -totalAmount, 
        type: 'purchase', 
        orderId: orderRef.id, 
        status: 'success',
        createdAt: new Date().toISOString() 
      })

      // 4. Update Artisans & Record Sales (Credit minus 5% commission)
      for (const [aId, amount] of Object.entries(artisanEarnings)) {
        const aRef = db.collection('users').doc(aId)
        // In a transaction, we must have read this document already
        const aData = snapsMap.get(aRef.path)
        const aBalance = aData ? (Number(aData.walletBalance) || 0) : 0
        
        const commissionRate = 0.05
        const commissionAmount = amount * commissionRate
        const netAmount = amount - commissionAmount

        t.update(aRef, { 
          walletBalance: aBalance + netAmount, 
          updatedAt: new Date().toISOString() 
        })
        
        const artisanTransRef = db.collection('transactions').doc()
        t.set(artisanTransRef, { 
          userId: aId, 
          amount: netAmount,
          grossAmount: amount,
          commissionAmount: commissionAmount,
          type: 'sale', 
          orderId: orderRef.id, 
          status: 'success',
          createdAt: new Date().toISOString() 
        })

        // Also track total commission in a central place for admin (optional but helpful)
        const commissionRef = db.collection('commissions').doc()
        t.set(commissionRef, {
          orderId: orderRef.id,
          artisanId: aId,
          amount: commissionAmount,
          grossAmount: amount,
          createdAt: new Date().toISOString()
        })
      }
    })

    // 4. Send Emails (Non-blocking)
    try {
      const orderData = { 
        id: orderRef.id, 
        total: totalAmount, 
        items: verifiedItems 
      }
      emailService.sendOrderConfirmation(orderData, { email: customerEmail, displayName: req.user.name })
      
      // Notify artisans
      for (const aId of Object.keys(artisanEarnings)) {
        db.collection('users').doc(aId).get().then(snap => {
          if (snap.exists) {
            emailService.sendArtisanOrderNotification(orderData, snap.data())
          }
        })
      }
    } catch (err) {
      console.error('Email trigger failed:', err)
    }

    return res.status(201).json({ message: 'Order placed' })
  } catch (error) {
    console.error('TRANSACTION FAILED:', error.message)
    return res.status(400).json({ message: error.message })
  }
}

export async function topUpWallet(req, res) {
  const { amount } = req.body
  const userId = req.user.uid
  if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })
  try {
    await db.runTransaction(async (t) => {
      const ref = db.collection('users').doc(userId)
      const snap = await t.get(ref)
      const bal = Number(snap.data()?.walletBalance) || 0
      t.update(ref, { walletBalance: bal + Number(amount), updatedAt: new Date().toISOString() })
      t.set(db.collection('transactions').doc(), { userId, amount: Number(amount), type: 'topup', createdAt: new Date().toISOString() })
    })
    res.json({ message: 'Topped up' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getMyOrders(req, res) {
  try {
    const snap = await db.collection('orders').where('customerId', '==', req.user.uid).get()
    res.json({ orders: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getArtisanOrders(req, res) {
  try {
    // Orders where this artisan is involved
    const snap = await db.collection('orders')
      .where('artisanIds', 'array-contains', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get()
    
    // Filter items to only show what belongs to this artisan for clarity
    const orders = snap.docs.map(d => {
      const data = d.data()
      const myItems = data.items.filter(i => i.artisanId === req.user.uid)
      const myGrossTotal = myItems.reduce((acc, i) => acc + (i.price * i.quantity), 0)
      const myCommission = myGrossTotal * 0.05
      const myNetTotal = myGrossTotal - myCommission
      
      return { 
        id: d.id, 
        ...data,
        items: myItems,
        grossTotal: myGrossTotal,
        commission: myCommission,
        total: myNetTotal // Artisan sees their net payout as the main total
      }
    })

    res.json({ orders })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getAllOrders(_req, res) {
  try {
    const snap = await db.collection('orders').get()
    res.json({ orders: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params
    const { status } = req.body
    const ref = db.collection('orders').doc(orderId)
    const snap = await ref.get()
    
    if (!snap.exists) return res.status(404).json({ message: 'Not found' })
    
    await ref.update({ 
      status, 
      updatedAt: new Date().toISOString() 
    })

    // Notify customer
    const orderData = snap.data()
    db.collection('users').doc(orderData.customerId).get().then(userSnap => {
      if (userSnap.exists) {
        emailService.sendOrderStatusUpdate({ id: orderId, ...orderData }, userSnap.data(), status)
      }
    })

    res.json({ message: `Order status updated to ${status}` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
