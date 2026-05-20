import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLES } from '@/utils/constants'
import { motion } from 'framer-motion'

function AuthCard({ mode, allowedRoles = [ROLES.CUSTOMER, ROLES.ARTISAN] }) {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  
  // Check if a specific role is requested (e.g., from checkout)
  const forcedRole = sessionStorage.getItem('auth_role_override')
  const [role, setRole] = useState(forcedRole || allowedRoles[0])

  const submit = async () => {
    await signIn(role)
    
    // Check for redirect after login
    const redirectPath = sessionStorage.getItem('redirect_after_login')
    sessionStorage.removeItem('auth_role_override') // Clean up
    
    if (redirectPath) {
      sessionStorage.removeItem('redirect_after_login')
      navigate(redirectPath)
      return
    }

    if (role === ROLES.ADMIN) {
      navigate('/admin')
    } else if (role === ROLES.ARTISAN) {
      navigate('/artisan')
    } else {
      navigate('/customer')
    }
  }

  const isAdminOnly = allowedRoles.length === 1 && allowedRoles[0] === ROLES.ADMIN

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[#E2E8F0]">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black text-[#1C2434] mb-4 leading-[1.1]"
          >
            {isAdminOnly ? 'Admin Portal' : (mode === 'signup' ? 'Join Artisan Marketplace' : 'Welcome Back')}
          </motion.h1>
          
          <p className="text-base text-[#64748B] font-medium mb-8">
            {isAdminOnly 
              ? 'Secure access for platform administrators.' 
              : 'Empowering local talent, one masterpiece at a time.'}
          </p>

          {!forcedRole && allowedRoles.length > 1 && (
            <div className="space-y-4 mb-8">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                {mode === 'signup' ? 'I want to' : 'Continue as'}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole(ROLES.CUSTOMER)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                    role === ROLES.CUSTOMER
                      ? 'border-[#003580] bg-[#003580] text-white shadow-lg shadow-[#003580]/20'
                      : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center ${role === ROLES.CUSTOMER ? 'bg-white/20' : 'bg-[#F1F5F9]'}`}>
                    <span className="text-xl">🛍️</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-xs uppercase tracking-widest">Buyer</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">I want to buy</span>
                  </div>
                </button>

                <button
                  onClick={() => setRole(ROLES.ARTISAN)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                    role === ROLES.ARTISAN
                      ? 'border-[#ff5e14] bg-[#ff5e14] text-white shadow-lg shadow-[#ff5e14]/20'
                      : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center ${role === ROLES.ARTISAN ? 'bg-white/20' : 'bg-[#F1F5F9]'}`}>
                    <span className="text-xl">🎨</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-xs uppercase tracking-widest">Artisan</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">I want to sell</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={submit}
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${
              role === ROLES.ARTISAN 
                ? 'bg-[#ff5e14] hover:bg-[#e65512] shadow-[#ff5e14]/20' 
                : 'bg-[#003580] hover:bg-[#002a66] shadow-[#003580]/20'
            }`}
          >
            <svg className="size-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.02 1.024-2.6 2.144-5.912 2.144-5.36 0-9.672-4.352-9.672-9.712s4.312-9.712 9.672-9.712c3.136 0 5.44 1.232 7.104 2.808l2.312-2.304c-1.968-1.88-4.512-3.32-9.416-3.32-7.856 0-14.224 6.368-14.224 14.224s6.368 14.224 14.224 14.224c4.264 0 7.48-1.416 9.944-4.008 2.56-2.56 3.36-6.144 3.36-8.992 0-.88-.08-1.72-.24-2.48h-13.064z" />
            </svg>
            Continue with Google
          </Button>

          {!isAdminOnly && (
            <div className="mt-8 pt-8 border-t border-[#F1F5F9] text-center">
              <p className="text-sm text-[#64748B] font-medium">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => navigate(mode === 'signup' ? '/login' : '/signup')}
                  className={`font-black uppercase tracking-widest text-[10px] hover:underline ${
                    role === ROLES.ARTISAN ? 'text-[#ff5e14]' : 'text-[#003580]'
                  }`}
                >
                  {mode === 'signup' ? 'Login Now' : 'Sign Up Free'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  return <AuthCard mode="login" />
}

export function SignupPage() {
  return <AuthCard mode="signup" />
}

export function AdminLoginPage() {
  return <AuthCard mode="login" allowedRoles={[ROLES.ADMIN]} />
}
