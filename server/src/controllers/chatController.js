import { db } from '../firebase/admin.js'

export async function sendMessage(req, res) {
  try {
    const payload = {
      chatId: req.body.chatId,
      senderId: req.user.uid,
      recipientId: req.body.recipientId,
      message: req.body.message || '',
      createdAt: new Date().toISOString(),
    }
    const ref = await db.collection('chats').add(payload)
    res.status(201).json({ id: ref.id, message: 'Message sent' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function getMyMessages(req, res) {
  try {
    const snap = await db.collection('chats').where('recipientId', '==', req.user.uid).get()
    res.json({ chats: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
