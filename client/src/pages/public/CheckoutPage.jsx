import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Loader2, Check, ShieldCheck, MapPin, CreditCard, Wallet, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { motion } from 'framer-motion'
import { useState } from 'react'
import api from '@/services/api'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [error, setError] = useState(null)

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const shipping = items.length > 0 ? 150 : 0 // Changed to KES reasonable shipping
  const total = subtotal + shipping

  const handleCheckout = async () => {
    if (!user) {
      // Store current path and forced role to redirect back after login
      sessionStorage.setItem('redirect_after_login', '/checkout')
      sessionStorage.setItem('auth_role_override', 'customer')
      navigate('/login')
      return
    }

    if (user.role !== 'customer') {
      setError('Only customers can place orders. Please sign up as a customer.')
      return
    }

    if (!user.location) {
      setError('Please set your delivery location in your profile before checking out.')
      return
    }

    if ((user.walletBalance || 0) < total) {
      setError('Insufficient wallet balance. Please top up your wallet.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const token = await (await import('@/firebase/config')).auth.currentUser?.getIdToken()
      await api.post('/orders', {
        items,
        total,
        subtotal,
        shipping
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setOrderPlaced(true)
      clearCart()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderPlaced) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="size-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-8"
          >
            <Check size={48} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-[#191e21] mb-4">Order Placed!</h1>
          <p className="text-lg text-black/60 mb-10 leading-relaxed">
            Thank you for supporting our artisans. Your handcrafted treasures are being prepared with care.
          </p>
          <Link to="/marketplace" className="inline-block rounded-2xl bg-[#ff5e14] px-10 py-5 text-lg font-black text-white hover:bg-[#e65512] transition-all shadow-xl shadow-[#ff5e14]/20">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-7xl px-4 pt-4">
          <div className="bg-[#f1f3f4] rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
            <div className="flex items-center gap-6 mb-4">
              <Link to="/marketplace" className="size-12 rounded-2xl bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <h1 className="text-4xl md:text-5xl font-black text-[#191e21] leading-[1.1]">
                Checkout
              </h1>
            </div>
            <p className="text-xl font-medium text-[#191e21]/40 max-w-2xl ml-[72px]">
              Complete your order.
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-4xl px-6 py-24">
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-100 rounded-[3rem] bg-[#f1f3f4]/30">
            <div className="size-24 rounded-[2rem] bg-white flex items-center justify-center mb-8 shadow-xl shadow-black/5">
              <ShoppingBag size={40} className="text-black/10" />
            </div>
            <h2 className="text-3xl font-black text-[#191e21] mb-3">Your cart is empty</h2>
            <p className="text-black/40 mb-10 max-w-xs text-center font-medium leading-relaxed">
              Add some handcrafted pieces before checking out.
            </p>
            <Link to="/marketplace" className="rounded-2xl bg-[#ff5e14] px-10 py-5 text-lg font-black text-white hover:bg-[#e65512] transition-all active:scale-95 shadow-xl shadow-[#ff5e14]/20">
              Start Shopping
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="bg-[#f1f3f4] rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="flex items-center gap-6 mb-4">
            <Link to="/cart" className="size-12 rounded-2xl bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-[#191e21] leading-[1.1]">
              Checkout
            </h1>
          </div>
          <p className="text-xl font-medium text-[#191e21]/40 max-w-2xl ml-[72px]">
            Complete your order for handcrafted treasures.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#f1f3f4] rounded-[2rem] p-8">
              <h2 className="text-xl font-black text-[#191e21] mb-6 flex items-center gap-3">
                <CreditCard size={24} className="text-[#ff5e14]" />
                Order Summary
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
                    <div className="size-20 rounded-xl bg-[#f1f3f4] overflow-hidden flex-shrink-0">
                      {item.images?.[0] || item.imageUrl ? (
                        <img src={item.images?.[0] || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/10 font-black text-xs">NO IMG</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[#191e21] truncate">{item.name}</h3>
                      <p className="text-sm text-black/40">${item.price?.toLocaleString()} × {item.quantity || 1}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                        className="size-8 rounded-lg bg-[#f1f3f4] flex items-center justify-center hover:bg-black/10 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-black">{item.quantity || 1}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        className="size-8 rounded-lg bg-[#f1f3f4] flex items-center justify-center hover:bg-black/10 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-xl font-black text-[#191e21] min-w-[80px] text-right">
                      KES {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="size-10 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#003580] rounded-[2rem] p-8 text-white sticky top-32">
              <h2 className="text-xl font-black mb-8">Order Total</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-medium">
                  <span className="text-white/70">Subtotal ({items.length} items)</span>
                  <span>KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-white/70">Shipping</span>
                  <span>KES {shipping.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/20 pt-4 flex justify-between">
                  <span className="font-black">Total</span>
                  <span className="text-3xl font-black">KES {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-white/80">
                    <Wallet size={18} />
                    <span className="font-medium">Wallet Balance</span>
                  </div>
                  <span className="font-black">KES {(user?.walletBalance || 0).toLocaleString()}</span>
                </div>
                {user && (user.walletBalance || 0) < total && (
                  <p className="text-red-300 text-sm font-medium flex items-center gap-2 mt-2">
                    <AlertCircle size={14} />
                    Insufficient funds
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-100 text-sm font-medium flex items-center gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  {error}
                </div>
              )}

              <motion.button
                onClick={handleCheckout}
                disabled={loading || (user && (user.walletBalance || 0) < total)}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 bg-[#ff5e14] hover:bg-[#e65512] transition-all shadow-xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Processing...'
                ) : (
                  user ? 'Pay with Wallet' : 'Sign In to Pay'
                )}
              </motion.button>

              <div className="mt-6 flex items-center gap-2 justify-center text-white/60 text-sm">
                <span>Secure Payment via Wallet</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}