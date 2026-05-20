import { db } from '../firebase/admin.js'
import { emailService } from '../services/emailService.js'

export async function suspendUser(req, res) {
  try {
    const { uid } = req.params
    await db.collection('users').doc(uid).set({ isSuspended: true }, { merge: true })
    res.json({ message: 'User suspended' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function approveArtisan(req, res) {
  try {
    const { uid } = req.params
    const userRef = db.collection('users').doc(uid)
    const snap = await userRef.get()
    
    if (!snap.exists) return res.status(404).json({ message: 'User not found' })
    
    await userRef.update({
      isApproved: true,
      artisanStatus: 'approved',
      updatedAt: new Date().toISOString()
    })

    // Send email
    emailService.sendArtisanApprovalNotification(snap.data())

    res.json({ message: 'Artisan approved' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getAdminAnalytics(_req, res) {
  try {
    const [users, stores, products, orders] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('stores').count().get(),
      db.collection('products').count().get(),
      db.collection('orders').count().get(),
    ])
    res.json({
      totals: {
        users: users.data().count,
        stores: stores.data().count,
        products: products.data().count,
        orders: orders.data().count,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
