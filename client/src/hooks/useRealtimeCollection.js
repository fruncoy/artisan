import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useRealtimeCollection(collectionName, conditions = []) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const conditionsKey = JSON.stringify(conditions)

  useEffect(() => {
    const parsedConditions = JSON.parse(conditionsKey)
    let q = collection(db, collectionName)
    if (parsedConditions.length) {
      q = query(q, ...parsedConditions.map((c) => where(c.field, c.op, c.value)))
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [collectionName, conditionsKey])

  return { items, loading }
}
