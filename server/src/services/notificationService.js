import { db } from '../firebase/admin.js'

export async function createNotification(uid, payload) {
  return db.collection('notifications').add({
    uid,
    ...payload,
    read: false,
    createdAt: new Date().toISOString(),
  })
}
