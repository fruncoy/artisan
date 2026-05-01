import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { Link } from 'react-router-dom'

export function CartSidebar() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotal } = useCartStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[70] h-full w-[75%] sm:w-[50%] md:w-[40%] lg:w-[35%] xl:w-[30%] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-black">Your Cart</h2>
                  <p className="text-xs font-bold text-black/30 uppercase tracking-widest">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeCart}
                className="size-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-black/40 hover:bg-black hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="size-24 rounded-2xl bg-neutral-100 overflow-hidden flex-shrink-0">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/5 font-black text-xs">NO IMG</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-black line-clamp-1">{item.name}</h3>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-black/20 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-black/30 uppercase">{item.category}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 bg-neutral-50 rounded-xl p-1 border border-black/5">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="size-7 rounded-lg flex items-center justify-center text-black hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="size-7 rounded-lg flex items-center justify-center text-black hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-black text-black">${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="size-20 rounded-[2rem] bg-neutral-50 flex items-center justify-center mb-6 border border-dashed border-black/10">
                    <ShoppingBag size={32} className="text-black/10" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Cart is empty</h3>
                  <p className="text-sm text-black/40 max-w-[200px] mx-auto">
                    Start exploring our marketplace to find unique treasures.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-black/5 bg-neutral-50/50 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-black/40 uppercase tracking-widest">Subtotal</span>
                  <span className="text-2xl font-black text-black">${getTotal().toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-center text-black/30 font-bold uppercase tracking-widest">
                  Shipping and taxes calculated at checkout
                </p>
                <Link 
                  to="/checkout"
                  onClick={closeCart}
                  className="w-full bg-black text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-xl shadow-black/10"
                >
                  Checkout Now
                  <ArrowRight size={20} />
                </Link>
                <button 
                  onClick={closeCart}
                  className="w-full py-2 text-xs font-black text-black/40 uppercase tracking-widest hover:text-black transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
