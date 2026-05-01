import { db } from '../firebase/admin.js'

export async function placeOrder(req, res) {
  const { items, shipping = 0 } = req.body
  const customerId = req.user.uid

  if (!items || !items.length) return res.status(400).json({ message: 'Cart is empty' })

  try {
    // 1. Identify all docs we need to touch outside the transaction
    const productIds = [...new Set(items.map(i => i.id))].filter(Boolean)
    const productRefs = productIds.map(id => db.collection('products').doc(id))
    
    // Pre-read products to find artisan IDs
    const tempSnaps = await Promise.all(productRefs.map(r => r.get()))
    const artisanIds = new Set()
    tempSnaps.forEach(s => { if (s.exists && s.data().artisanId) artisanIds.add(s.data().artisanId) })

    // 2. Prepare ALL references
    const customerRef = db.collection('users').doc(customerId)
    const artisanRefs = [...artisanIds].map(id => db.collection('users').doc(id))
    
    // Create a unique set of all references to avoid duplicate reads in t.getAll
    const allRefsMap = new Map()
    allRefsMap.set(customerRef.path, customerRef)
    productRefs.forEach(ref => allRefsMap.set(ref.path, ref))
    artisanRefs.forEach(ref => allRefsMap.set(ref.path, ref))
    
    const uniqueRefs = Array.from(allRefsMap.values())

    // 3. START THE TRANSACTION
    await db.runTransaction(async (t) => {
      // --- PHASE 1: ALL READS AT THE TOP ---
      const allSnaps = await t.getAll(...uniqueRefs)
      
      const snapsMap = new Map()
      allSnaps.forEach(snap => { if (snap && snap.exists) snapsMap.set(snap.id, snap.data()) })

      // --- PHASE 2: LOGIC (No reads allowed after this point) ---
      const customerData = snapsMap.get(customerId)
      if (!customerData) throw new Error('Customer profile not found')

      let subtotal = 0
      const artisanEarnings = {}
      const verifiedItems = []

      for (const item of items) {
        const pData = snapsMap.get(item.id)
        if (!pData) throw new Error(`Product ${item.id} not found`)
        
        const price = Number(pData.price) || 0
        const qty = Number(item.quantity) || 1
        const aId = pData.artisanId

        verifiedItems.push({ id: item.id, name: pData.name, price, quantity: qty, artisanId: aId })
        subtotal += price * qty
        if (aId) artisanEarnings[aId] = (artisanEarnings[aId] || 0) + (price * qty)
      }

      const totalAmount = subtotal + Number(shipping)
      const balance = Number(customerData.walletBalance) || 0
      if (balance < totalAmount) throw new Error(`Insufficient funds: KES ${totalAmount}`)

      // --- PHASE 3: ALL WRITES ---
      // Update Customer
      t.update(customerRef, { 
        walletBalance: balance - totalAmount, 
        updatedAt: new Date().toISOString() 
      })

      // Create Order
      const orderRef = db.collection('orders').doc()
      t.set(orderRef, {
        id: orderRef.id,
        customerId,
        items: verifiedItems,
        total: totalAmount,
        status: 'placed',
        createdAt: new Date().toISOString()
      })

      // Record Customer Transaction
      t.set(db.collection('transactions').doc(), { 
        userId: customerId, 
        amount: -totalAmount, 
        type: 'purchase', 
        orderId: orderRef.id, 
        createdAt: new Date().toISOString() 
      })

      // Update Artisans & Record Sales
      for (const [aId, amount] of Object.entries(artisanEarnings)) {
        const aRef = db.collection('users').doc(aId)
        const aData = snapsMap.get(aId)
        const aBalance = aData ? (Number(aData.walletBalance) || 0) : 0
        
        t.update(aRef, { 
          walletBalance: aBalance + amount, 
          updatedAt: new Date().toISOString() 
        })
        
        t.set(db.collection('transactions').doc(), { 
          userId: aId, 
          amount, 
          type: 'sale', 
          orderId: orderRef.id, 
          createdAt: new Date().toISOString() 
        })
      }
    })

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
    const snap = await db.collection('orders').where('artisanId', '==', req.user.uid).get()
    res.json({ orders: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
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
    await ref.set({ status, updatedAt: new Date().toISOString() }, { merge: true })
    res.json({ message: 'Updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
