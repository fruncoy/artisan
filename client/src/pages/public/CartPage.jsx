import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { motion } from 'framer-motion'

export function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore()

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
                Your Cart
              </h1>
            </div>
            <p className="text-xl font-medium text-[#191e21]/40 max-w-2xl ml-[72px]">
              Review your selected handcrafted treasures.
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
              Looks like you haven't added any handcrafted pieces to your collection yet.
            </p>
            <Link to="/marketplace" className="rounded-2xl bg-[#ff5e14] px-10 py-5 text-lg font-black text-white hover:bg-[#e65512] transition-all active:scale-95 shadow-xl shadow-[#ff5e14]/20">
              Start Shopping
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="bg-[#f1f3f4] rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="flex items-center gap-6 mb-4">
            <Link to="/marketplace" className="size-12 rounded-2xl bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-[#191e21] leading-[1.1]">
              Your Cart
            </h1>
          </div>
          <p className="text-xl font-medium text-[#191e21]/40 max-w-2xl ml-[72px]">
            {items.length} handcrafted {items.length === 1 ? 'piece' : 'pieces'} selected.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          {items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 bg-[#f1f3f4] rounded-[2rem] p-6"
            >
              <Link to={`/product/${item.id}`} className="size-24 rounded-2xl bg-white overflow-hidden flex-shrink-0 shadow-sm">
                {item.images?.[0] || item.imageUrl ? (
                  <img src={item.images?.[0] || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/10 font-black text-xs">NO IMAGE</div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`} className="font-black text-xl text-[#191e21] hover:text-[#ff5e14] transition-colors truncate block">{item.name}</Link>
                <p className="text-sm text-black/40 mt-1">${item.price?.toLocaleString()} each</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                  className="size-10 rounded-xl bg-white flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <span className="text-sm font-black">-</span>
                </button>
                <span className="w-10 text-center font-black text-lg">{item.quantity || 1}</span>
                <button 
                  onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                  className="size-10 rounded-xl bg-white flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <span className="text-sm font-black">+</span>
                </button>
              </div>
              <div className="text-2xl font-black text-[#191e21] min-w-[100px] text-right">
                ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
              </div>
              <button 
                onClick={() => removeItem(item.id)}
                className="size-12 rounded-2xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors text-red-500"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-[#003580] rounded-[2rem] p-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xl font-medium text-white/70">Subtotal</span>
            <span className="text-4xl font-black">KES {subtotal.toLocaleString()}</span>
          </div>
          <Link 
            to="/checkout"
            className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 bg-[#ff5e14] hover:bg-[#e65512] transition-all shadow-xl shadow-black/20"
          >
            <ShoppingCart size={24} />
            Proceed to Checkout
          </Link>
        </div>
      </main>
    </div>
  )
}