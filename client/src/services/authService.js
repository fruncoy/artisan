import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, db, googleProvider } from '@/firebase/config'
import { ARTISAN_STATUS, ROLES } from '@/utils/constants'

export async function signInWithGoogle(selectedRole) {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  const userRef = doc(db, 'users', user.uid)
  const existing = await getDoc(userRef)

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: selectedRole || ROLES.CUSTOMER,
      artisanStatus:
        selectedRole === ROLES.ARTISAN ? ARTISAN_STATUS.PENDING : null,
      isSuspended: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const profile = (await getDoc(userRef)).data()
  return { firebaseUser: user, profile }
}

export function logout() {
  return signOut(auth)
}
