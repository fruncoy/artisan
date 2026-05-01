import { db } from '../firebase/admin.js'

export async function applyForArtisan(req, res) {
  try {
    const uid = req.user.uid
    const payload = {
      uid,
      motivation: req.body.motivation || '',
      portfolioUrl: req.body.portfolioUrl || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
    }
    await db.collection('artisanApplications').doc(uid).set(payload, { merge: true })
    await db.collection('users').doc(uid).set({ artisanStatus: 'pending' }, { merge: true })
    return res.status(201).json({ message: 'Application submitted', application: payload })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export async function listArtisanApplications(_req, res) {
  try {
    const snap = await db.collection('artisanApplications').orderBy('createdAt', 'desc').get()
    const applications = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.json({ applications })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function reviewArtisanApplication(req, res) {
  try {
    const { uid } = req.params
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    await db.collection('artisanApplications').doc(uid).set(
      {
        status,
        reviewedBy: req.user.uid,
        reviewedAt: new Date().toISOString(),
      },
      { merge: true },
    )
    await db.collection('users').doc(uid).set(
      {
        role: status === 'approved' ? 'artisan' : 'customer',
        artisanStatus: status,
      },
      { merge: true },
    )
    return res.json({ message: `Application ${status}` })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
