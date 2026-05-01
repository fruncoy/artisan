import { auth, db } from '../firebase/admin.js'

export async function verifyAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'No auth token provided' })
    const decoded = await auth.verifyIdToken(token)
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists) return res.status(401).json({ message: 'User not found' })
    req.user = userDoc.data()
    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized', error: error.message })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden for this role' })
    }
    next()
  }
}
