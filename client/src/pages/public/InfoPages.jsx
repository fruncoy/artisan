import { MapPin, Star, ArrowRight, Loader2, Users, Search, ChevronDown } from 'lucide-react'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function AboutPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="bg-[#f1f3f4] rounded-[2rem] p-8 md:p-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-[#191e21] mb-6 leading-[1.1]">
            About AMP
          </h1>
          <p className="text-xl font-medium text-[#191e21]/40 max-w-2xl mx-auto leading-relaxed">
            We are building the future of the creative economy by connecting world-class artisans with conscious consumers.
          </p>
        </div>
      </section>
      
      <main className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-[#191e21]">Our Mission</h2>
            <p className="text-lg text-black/60 leading-relaxed font-medium">
              AMP (Artisan Marketplace Platform) was born from a desire to preserve traditional craftsmanship in a digital-first world. We believe every object should have a story, a soul, and a creator behind it.
            </p>
            <p className="text-lg text-black/60 leading-relaxed font-medium">
              By removing the middlemen, we ensure that more of your purchase goes directly to the person who made it, fostering sustainable livelihoods for creators globally.
            </p>
          </div>
          <div className="aspect-[4/3] bg-[#f1f3f4] rounded-[3rem] flex items-center justify-center font-black text-black/5 text-6xl rotate-3 hover:rotate-0 transition-transform duration-700">
            OUR STORY
          </div>
        </div>
      </main>
    </div>
  )
}

export function ArtisansPage() {
  const { items: artisans, loading } = useRealtimeCollection('stores')

  return (
    <div className="bg-white min-h-screen">
      {/* Kayak-style Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="bg-[#f1f3f4] rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black text-[#191e21] mb-12 leading-[1.1]"
            >
              Meet the masters <br />behind the craft.
            </motion.h1>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-2xl shadow-xl shadow-black/5 flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center px-4 py-3 gap-3 border-r border-neutral-100 last:border-0">
                <Search size={20} className="text-[#191e21]/40" />
                <input 
                  type="text"
                  placeholder="Search for an artisan or store..."
                  className="w-full bg-transparent outline-none font-bold text-[#191e21] placeholder:text-[#191e21]/30"
                />
              </div>
              
              <button className="bg-[#ff5e14] hover:bg-[#e65512] text-white px-10 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2">
                <Search size={24} />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#ff5e14]" size={40} />
            <p className="mt-4 text-black/40 font-bold uppercase tracking-widest text-xs">Loading creators...</p>
          </div>
        ) : artisans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {artisans.map(artisan => (
              <Link 
                to={`/store/${artisan.id}`}
                key={artisan.id} 
                className="group bg-[#f1f3f4] p-8 rounded-[3rem] transition-all hover:bg-white hover:shadow-2xl hover:shadow-black/5"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="size-24 rounded-[2rem] bg-white flex items-center justify-center font-black text-3xl text-black/10 uppercase overflow-hidden shadow-sm">
                    {artisan.logo ? (
                      <img src={artisan.logo} alt={artisan.name} className="w-full h-full object-cover" />
                    ) : (
                      artisan.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#191e21] group-hover:text-[#ff5e14] transition-colors">{artisan.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5e14] bg-[#ff5e14]/5 px-2 py-1 rounded-md">
                      {artisan.category || 'Master Artisan'}
                    </span>
                  </div>
                </div>
                
                <p className="text-[#191e21]/60 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                  {artisan.description || 'Dedicated to preserving the art of traditional craftsmanship through modern design and sustainable practices.'}
                </p>
                
                <div className="flex items-center justify-between pt-8 border-t border-black/5">
                  <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-[#191e21] group-hover:bg-[#ff5e14] group-hover:text-white transition-all shadow-sm">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-[#f1f3f4] rounded-[3rem]">
            <div className="size-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users size={32} className="text-black/10" />
            </div>
            <h3 className="text-2xl font-black text-[#191e21] mb-2">No artisans found</h3>
            <p className="text-black/40 font-medium">Our community is growing, check back soon!</p>
          </div>
        )}
      </main>
    </div>
  )
}
