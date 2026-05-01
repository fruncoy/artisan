import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Search, 
  Palette, 
  Hammer, 
  Gem, 
  Scissors, 
  Trees,
  CheckCircle2,
  ShoppingBag,
  Users
} from 'lucide-react'
import { useState } from 'react'

export function LandingPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(search)}`)
    }
  }

  const categories = [
    { name: 'Jewelry & Accessories', icon: <Gem size={18} />, color: 'bg-emerald-500' },
    { name: 'Home Decor', icon: <Trees size={18} />, color: 'bg-amber-700' },
    { name: 'Textiles & Baskets', icon: <Scissors size={18} />, color: 'bg-indigo-500' },
    { name: 'Ceramics & Pottery', icon: <Palette size={18} />, color: 'bg-orange-500' },
  ]

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="bg-[#003580] pt-8 pb-32 px-6 rounded-br-2xl md:rounded-br-3xl">
        <div className="mx-auto max-w-7xl">
          {/* Secondary Nav Row */}
          <div className="flex items-center gap-4 mb-12">
            <Link 
              to="/marketplace" 
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white font-bold text-sm whitespace-nowrap hover:bg-white/20 transition-all"
            >
              <ShoppingBag size={18} />
              Marketplace
            </Link>
            <Link 
              to="/artisans" 
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-transparent text-white/70 hover:text-white font-medium text-sm transition-all whitespace-nowrap hover:bg-white/5"
            >
              <Users size={18} />
              Artisans
            </Link>
          </div>

          <div className="max-w-3xl">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight"
            >
              Find your next <br />handcrafted masterpiece
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/70 mb-0"
            >
              Search unique products, authentic stores, and much more...
            </motion.p>
          </div>
        </div>
      </section>

      {/* Booking-style Search Bar Overlapping */}
      <section className="mx-auto max-w-7xl px-6 -mt-8">
        <form 
          onSubmit={handleSearch}
          className="bg-[#febb02] p-1 rounded-lg flex flex-col lg:flex-row gap-1 shadow-2xl"
        >
          <div className="flex-1 bg-white rounded-md flex items-center px-4 py-3 min-w-0">
            <Search className="text-black/40 mr-3 shrink-0" size={20} />
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-black font-medium placeholder:text-black/40 outline-none"
            />
          </div>

          <button 
            type="submit"
            className="bg-[#006ce4] hover:bg-[#0057b8] text-white font-bold text-lg px-12 py-3 rounded-md transition-colors"
          >
            Search
          </button>
        </form>
      </section>

      {/* Trending Categories Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-2xl font-black text-black mb-2">Explore by category</h2>
        <p className="text-black/40 mb-8 font-medium">Discover the most popular crafts in our community.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link 
              to={`/marketplace?category=${cat.name}`}
              key={cat.name} 
              className="group relative h-48 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className={`absolute inset-0 ${cat.color} opacity-90 transition-opacity group-hover:opacity-100`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                <div className="mb-3 scale-150 group-hover:scale-[1.7] transition-transform duration-500">
                  {cat.icon}
                </div>
                <span className="text-lg font-black tracking-tight">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
