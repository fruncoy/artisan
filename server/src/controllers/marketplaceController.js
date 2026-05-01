import { db } from '../firebase/admin.js'

export async function getProducts(req, res) {
  try {
    const { query = '', category = '' } = req.query
    let q = db.collection('products')
    if (category) q = q.where('category', '==', category)
    const snap = await q.limit(40).get()
    const products = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => item.name?.toLowerCase().includes(query.toLowerCase()))
    res.json({ products })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function createProduct(req, res) {
  try {
    const payload = {
      ...req.body,
      artisanId: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const doc = await db.collection('products').add(payload)
    res.status(201).json({ message: 'Product created', id: doc.id })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getMyProducts(req, res) {
  try {
    const snap = await db.collection('products').where('artisanId', '==', req.user.uid).get()
    res.json({ products: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function updateProduct(req, res) {
  try {
    const { productId } = req.params
    const ref = db.collection('products').doc(productId)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ message: 'Product not found' })
    const product = snap.data()
    if (req.user.role !== 'admin' && product.artisanId !== req.user.uid) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    await ref.set({ ...req.body, updatedAt: new Date().toISOString() }, { merge: true })
    res.json({ message: 'Product updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function deleteProduct(req, res) {
  try {
    const { productId } = req.params
    const ref = db.collection('products').doc(productId)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ message: 'Product not found' })
    const product = snap.data()
    if (req.user.role !== 'admin' && product.artisanId !== req.user.uid) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    await ref.delete()
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
