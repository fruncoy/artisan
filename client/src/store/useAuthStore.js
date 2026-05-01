import { create } from 'zustand'
import { doc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { logout, signInWithGoogle } from '@/services/authService'

export const useAuthStore = create((set, get) => ({
  user: null,
  originalUser: null,
  loading: true,
  initialized: false,
  unsubscribe: null,
  init: () => {
    if (get().initialized) return
    set({ initialized: true })
    
    // Check for session impersonation
    const impUser = sessionStorage.getItem('impersonated_user')
    const origAdmin = sessionStorage.getItem('original_admin')
    
    onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous snapshot listener
      const currentUnsubscribe = get().unsubscribe
      if (currentUnsubscribe) currentUnsubscribe()

      if (!firebaseUser) {
        set({ user: null, loading: false, unsubscribe: null })
        return
      }
      
      const userRef = doc(db, 'users', firebaseUser.uid)
      const unsub = onSnapshot(userRef, (snap) => {
        const dbUser = snap.exists() ? { uid: snap.id, ...snap.data() } : null
        
        if (impUser && origAdmin) {
          set({ 
            user: JSON.parse(impUser), 
            originalUser: JSON.parse(origAdmin),
            loading: false 
          })
        } else {
          set({ user: dbUser, loading: false })
        }
      })

      set({ unsubscribe: unsub })
    })
  },
  signIn: async (role) => {
    const response = await signInWithGoogle(role)
    set({ user: response.profile })
  },
  signOut: async () => {
    await logout()
    sessionStorage.removeItem('impersonated_user')
    sessionStorage.removeItem('original_admin')
    set({ user: null, originalUser: null })
  },
  impersonate: (targetUser, openNewWindow = false) => {
    const currentUser = get().user
    const adminUser = get().originalUser || currentUser
    
    if (adminUser.role !== 'admin') return
    
    if (openNewWindow) {
      sessionStorage.setItem('impersonated_user', JSON.stringify(targetUser))
      sessionStorage.setItem('original_admin', JSON.stringify(adminUser))
      
      const url = targetUser.role === 'artisan' ? '/artisan' : '/customer'
      window.open(url, 'ImpersonationPopup', 'width=1400,height=900,menubar=no,toolbar=no')
    } else {
      set({ 
        originalUser: adminUser,
        user: targetUser 
      })
    }
  },
  stopImpersonating: () => {
    sessionStorage.removeItem('impersonated_user')
    sessionStorage.removeItem('original_admin')
    const original = get().originalUser
    if (!original) return
    set({ 
      user: original,
      originalUser: null 
    })
  },
}))
