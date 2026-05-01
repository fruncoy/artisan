import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLES } from '@/utils/constants'
import { motion } from 'framer-motion'

function AuthCard({ mode }) {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  
  // Check if a specific role is requested (e.g., from checkout)
  const forcedRole = sessionStorage.getItem('auth_role_override')
  const [role, setRole] = useState(forcedRole || ROLES.CUSTOMER)

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

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md pt-12 px-4">
        <div className="bg-[#f1f3f4] rounded-[2.5rem] p-8 md:p-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black text-[#191e21] mb-4 leading-[1.1]"
          >
            {forcedRole === ROLES.CUSTOMER ? 'Customer Sign In' : (mode === 'signup' ? 'Create AMP Account' : 'Welcome back to AMP')}
          </motion.h1>
          <p className="text-base text-black/50 font-medium mb-8">
            {forcedRole === ROLES.CUSTOMER ? 'Sign in as a customer to complete your purchase.' : 'Choose your role and continue with Google.'}
          </p>

          {!forcedRole && (
            <div className="mb-8">
              <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-4">Select Role</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(ROLES).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-2xl border-2 px-4 py-4 text-sm capitalize font-black transition-all ${
                      role === r
                        ? 'border-[#ff5e14] bg-[#ff5e14] text-white'
                        : 'border-black/10 bg-white text-black/60 hover:border-black/30'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={submit}
            className="w-full bg-[#ff5e14] hover:bg-[#e65512] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#ff5e14]/20"
          >
            Continue with Google
          </Button>
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
