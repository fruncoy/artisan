import { db } from '../firebase/admin.js'

export async function upsertMyStore(req, res) {
  try {
    const payload = {
      artisanId: req.user.uid,
      name: req.body.name || 'My Artisan Store',
      description: req.body.description || '',
      bannerUrl: req.body.bannerUrl || '',
      updatedAt: new Date().toISOString(),
    }
    await db.collection('stores').doc(req.user.uid).set(payload, { merge: true })
    res.json({ message: 'Store saved', store: payload })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getMyStore(req, res) {
  try {
    const snap = await db.collection('stores').doc(req.user.uid).get()
    res.json({ store: snap.exists ? { id: snap.id, ...snap.data() } : null })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getStoreById(req, res) {
  try {
    const snap = await db.collection('stores').doc(req.params.storeId).get()
    if (!snap.exists) return res.status(404).json({ message: 'Store not found' })
    res.json({ store: { id: snap.id, ...snap.data() } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
export async function getStores(req, res) {
  try {
    const snap = await db.collection('stores').limit(20).get()
    res.json({ stores: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
