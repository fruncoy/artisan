import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, User, Menu, Search, X, ArrowRight, Heart, Sparkles } from 'lucide-react'
import { cn } from '../utils/cn'
import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { CartSidebar } from './CartSidebar'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  
  const { getItemCount, openCart } = useCartStore()
  const { user, signOut } = useAuthStore()
  const itemCount = getItemCount()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Artisans', path: '/artisans' }
  ]

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white px-6 py-4"
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-md transition-all"
            >
              <Menu size={20} className="text-black" />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-heading font-black tracking-tighter text-[#003580]">AMP</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-neutral-100 rounded-full text-black transition-all">
              <Heart size={20} />
            </button>
            
            <button 
              onClick={openCart}
              className="p-2 hover:bg-neutral-100 rounded-full text-black transition-all relative"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 size-4 bg-[#ff5e14] rounded-full text-[8px] font-black text-white flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-neutral-200 mx-1" />
            
            {user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to={user.role === 'admin' ? '/admin' : user.role === 'artisan' ? '/artisan' : '/customer'}
                  className="p-2 hover:bg-neutral-100 rounded-full text-black transition-all"
                >
                  <User size={20} />
                </Link>
                <button 
                  onClick={signOut}
                  className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="p-2 hover:bg-neutral-100 rounded-full text-black transition-all"
              >
                <User size={20} />
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hamburger Menu Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white z-[70] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-2xl font-black text-[#003580]">Menu</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-2xl font-black text-black hover:text-[#ff5e14] transition-all flex items-center justify-between group"
                  >
                    {link.name}
                    <ArrowRight size={20} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </nav>

              <div className="absolute bottom-8 left-8 right-8 pt-8 border-t border-neutral-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-4">Account</p>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-neutral-100 flex items-center justify-center font-black text-[#003580]">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black truncate w-40">{user.email}</p>
                      <button 
                        onClick={() => {
                          signOut()
                          setIsMenuOpen(false)
                        }}
                        className="text-[10px] font-black text-[#ff5e14] uppercase"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold text-black hover:text-[#ff5e14]"
                  >
                    <User size={18} />
                    Sign in to your account
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartSidebar />
    </>
  )
}
