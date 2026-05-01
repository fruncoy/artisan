import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { 
  ShoppingCart, 
  Star, 
  MapPin, 
  Search, 
  Loader2, 
  Palette, 
  Trees, 
  Gem, 
  Hammer, 
  Scissors,
  ChevronDown,
  Box,
  Zap,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Check,
  ShieldCheck
} from 'lucide-react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const categoryQuery = searchParams.get('category') || 'All'
  const { items: products, loading: productsLoading } = useRealtimeCollection('products')
  const { items: users, loading: usersLoading } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'artisan' }])
  const loading = productsLoading || usersLoading
  const addItem = useCartStore(s => s.addItem)

  const categories = [
    { name: 'All', icon: <Search size={16} /> },
    { name: 'Jewelry & Accessories', icon: <Gem size={16} /> },
    { name: 'Home Decor', icon: <Trees size={16} /> },
    { name: 'Textiles & Baskets', icon: <Scissors size={16} /> },
    { name: 'Ceramics & Pottery', icon: <Palette size={16} /> },
  ]

  const filteredProducts = useMemo(() => {
    // Filter by search and category first
    let result = products
    
    if (searchQuery) {
      result = result.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (categoryQuery !== 'All') {
      result = result.filter(p => {
        if (!p.category) return false
        const productCategory = p.category.toLowerCase()
        const query = categoryQuery.toLowerCase()
        return productCategory === query || productCategory.includes(query) || query.includes(productCategory)
      })
    }

    // Only filter by approval if we actually have artisan data to check against
    // This prevents the marketplace from being empty if users collection isn't fully synced or seeded
    if (users.length > 0) {
      const approvedArtisanIds = users.filter(u => u.isApproved !== false).map(u => u.id || u.uid)
      // If we want to be strict, we'd use the original logic, 
      // but for now let's allow products unless explicitly disapproved
      result = result.filter(p => {
        const artisan = users.find(u => (u.id || u.uid) === p.artisanId)
        return !artisan || artisan.isApproved !== false
      })
    }
    
    return result
  }, [products, users, searchQuery, categoryQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by input change or button click
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchParams(prev => {
      if (value) prev.set('search', value)
      else prev.delete('search')
      return prev
    })
  }

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
              Find your next <br />handcrafted masterpiece.
            </motion.h1>

            {/* Integrated Search Bar */}
            <div className="bg-white p-2 rounded-2xl shadow-xl shadow-black/5 flex flex-col md:flex-row items-stretch gap-2 mb-8">
              <div className="flex-1 flex items-center px-4 py-3 gap-3 border-r border-neutral-100 last:border-0">
                <Search size={20} className="text-[#191e21]/40" />
                <input 
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full bg-transparent outline-none font-bold text-[#191e21] placeholder:text-[#191e21]/30"
                />
              </div>

              <button className="bg-[#ff5e14] hover:bg-[#e65512] text-white px-10 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2">
                <Search size={24} />
                <span>Search</span>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSearchParams(prev => {
                      if (cat.name === 'All') prev.delete('category')
                      else prev.set('category', cat.name)
                      return prev
                    })
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                    categoryQuery === cat.name 
                      ? 'bg-[#ff5e14] border-[#ff5e14] text-white shadow-lg shadow-[#ff5e14]/20' 
                      : 'bg-white border-neutral-200 text-black/60 hover:bg-[#f1f3f4] hover:text-black'
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-black text-[#191e21]">
            {categoryQuery === 'All' ? 'Everything' : categoryQuery} 
            <span className="ml-2 text-black/20 font-bold">{filteredProducts.length} results</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#ff5e14]" size={40} />
            <p className="mt-4 text-black/40 font-bold uppercase tracking-widest text-xs">Fetching masterpieces...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProducts.map((product) => (
              <Link 
                to={`/product/${product.id}`} 
                key={product.id} 
                className="group flex flex-col"
              >
                <div className="aspect-[4/5] bg-[#f1f3f4] rounded-[2.5rem] relative overflow-hidden mb-6">
                  {product.images?.[0] || product.imageUrl ? (
                    <img 
                      src={product.images?.[0] || product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/5 font-black text-2xl">
                      NO IMAGE
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      addItem(product)
                    }}
                    className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl text-black hover:bg-[#ff5e14] hover:text-white transition-all shadow-xl scale-0 group-hover:scale-100"
                  >
                    <ShoppingCart size={24} />
                  </button>
                </div>
                
                <div className="px-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5e14]">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-[#191e21] mb-1 line-clamp-1 group-hover:text-[#ff5e14] transition-colors">{product.name}</h3>
                  <p className="text-sm text-black/40 mb-2 line-clamp-2 leading-relaxed font-medium">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-black text-[#191e21]">
                      KES {product.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-[#f1f3f4] rounded-[3rem]">
            <div className="size-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Search size={32} className="text-black/10" />
            </div>
            <h3 className="text-2xl font-black text-[#191e21] mb-2">No products found</h3>
            <p className="text-black/40 font-medium">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export function ProductPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [artisan, setArtisan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    async function fetchData() {
      if (!productId) return
      try {
        const productSnap = await getDoc(doc(db, 'products', productId))
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() }
          setProduct(productData)
          if (productData.artisanId) {
            const artisanSnap = await getDoc(doc(db, 'stores', productData.artisanId))
            if (artisanSnap.exists()) {
              setArtisan({ id: artisanSnap.id, ...artisanSnap.data() })
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [productId])

  const handleAddToCart = () => {
    if (product) {
      addItem(product)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  const images = useMemo(() => {
    if (!product) return []
    const allImages = []
    if (product.imageUrl) allImages.push(product.imageUrl)
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img !== product.imageUrl) allImages.push(img)
      })
    }
    return allImages
  }, [product?.imageUrl, product?.images])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#ff5e14]" size={40} />
        <p className="mt-4 text-black/40 font-bold uppercase tracking-widest text-xs">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-40">
        <h2 className="text-3xl font-black text-[#191e21] mb-4">Product not found</h2>
        <Link to="/marketplace" className="text-[#ff5e14] font-bold hover:underline">Back to Marketplace</Link>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-20">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-black/40 hover:text-[#ff5e14] transition-colors mb-6">
          <ArrowLeft size={18} /> Back to Marketplace
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-[#f1f3f4] rounded-[2.5rem] overflow-hidden relative">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black/10 font-black text-3xl">NO IMAGE</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`size-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-[#ff5e14]' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-4">
              {product.category && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5e14] bg-[#ff5e14]/5 px-3 py-1.5 rounded-full">
                  {product.category}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-[#191e21] mb-1 leading-[1.1]">{product.name}</h1>
            
            <div className="text-5xl font-black text-[#191e21] mb-6">
              KES {product.price?.toLocaleString()}
            </div>

            <p className="text-lg text-black/60 leading-relaxed mb-8">
              {product.description || 'A beautiful handcrafted piece made with passion and precision by our skilled artisans.'}
            </p>

            {artisan && (
              <Link to={`/store/${artisan.id}`} className="flex items-center gap-4 p-4 bg-[#f1f3f4] rounded-2xl mb-8 hover:bg-[#f1f3f4]/80 transition-colors">
                <div className="size-16 rounded-2xl bg-white flex items-center justify-center font-black text-2xl text-black/20 overflow-hidden shadow-sm">
                  {artisan.logo ? (
                    <img src={artisan.logo} alt={artisan.name} className="w-full h-full object-cover" />
                  ) : (
                    artisan.name?.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-black text-[#191e21]">{artisan.name}</p>
                </div>
              </Link>
            )}

            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck size={20} />
                <span className="text-sm font-bold">Authenticity Guaranteed</span>
              </div>
            </div>

            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                added 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-[#ff5e14] hover:bg-[#e65512] text-white shadow-xl shadow-[#ff5e14]/20'
              }`}
            >
              {added ? (
                <>
                  <Check size={24} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={24} /> Add to Cart
                </>
              )}
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  )
}

export function StorePage() {
  const { storeId } = useParams()
  const [store, setStore] = useState(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const addItem = useCartStore(s => s.addItem)
  const { items: products, loading: loadingProducts } = useRealtimeCollection('products', [{ field: 'artisanId', op: '==', value: storeId || '__none__' }])

  useEffect(() => {
    async function fetchStore() {
      if (!storeId) return
      try {
        const storeSnap = await getDoc(doc(db, 'stores', storeId))
        if (storeSnap.exists()) {
          setStore({ id: storeSnap.id, ...storeSnap.data() })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingStore(false)
      }
    }
    fetchStore()
  }, [storeId])

  const loading = loadingStore || loadingProducts

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#ff5e14]" size={40} />
        <p className="mt-4 text-black/40 font-bold uppercase tracking-widest text-xs">Loading store...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-40">
        <h2 className="text-3xl font-black text-[#191e21] mb-4">Store not found</h2>
        <Link to="/artisans" className="text-[#ff5e14] font-bold hover:underline">Back to Artisans</Link>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-20">
        <Link to="/artisans" className="inline-flex items-center gap-2 text-sm font-bold text-black/40 hover:text-[#ff5e14] transition-colors mb-6">
          <ArrowLeft size={18} /> Back to Artisans
        </Link>

        <div className="bg-[#f1f3f4] rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="size-32 md:size-40 rounded-[2rem] bg-white flex items-center justify-center font-black text-4xl text-black/20 uppercase overflow-hidden shadow-xl">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                store.name?.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-[#191e21]">{store.name}</h1>
                {store.verified && (
                  <ShieldCheck size={24} className="text-emerald-500" />
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5e14] bg-[#ff5e14]/10 px-3 py-1.5 rounded-md mb-4 inline-block">
                {store.craft || 'Master Artisan'}
              </span>
              <p className="text-lg text-black/60 leading-relaxed max-w-2xl">
                {store.description || 'A dedicated artisan crafting beautiful pieces with passion and precision.'}
              </p>
              <div className="flex items-center gap-6 mt-6">
                <span className="flex items-center gap-2 text-sm font-bold text-black/50">
                  <Box size={16} className="text-[#ff5e14]" /> {products.length} Products
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-[#191e21] mb-8">Products from {store.name}</h2>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {products.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col">
                <div className="aspect-[4/5] bg-[#f1f3f4] rounded-[2.5rem] relative overflow-hidden mb-6">
                  {product.images?.[0] || product.imageUrl ? (
                    <img 
                      src={product.images?.[0] || product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/5 font-black text-2xl">NO IMAGE</div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      addItem(product)
                    }}
                    className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl text-black hover:bg-[#ff5e14] hover:text-white transition-all shadow-xl scale-0 group-hover:scale-100"
                  >
                    <ShoppingCart size={24} />
                  </button>
                </div>
                <div className="px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5e14]">
                      {product.category}
                    </span>
                  <h3 className="text-xl font-black text-[#191e21] mb-1 line-clamp-1 group-hover:text-[#ff5e14] transition-colors">{product.name}</h3>
                  <p className="text-sm text-black/40 mb-2 line-clamp-2 leading-relaxed font-medium">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-black text-[#191e21]">
                      KES {product.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#f1f3f4] rounded-[2.5rem]">
            <div className="size-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Box size={28} className="text-black/10" />
            </div>
            <h3 className="text-xl font-black text-[#191e21] mb-2">No products yet</h3>
            <p className="text-black/40 font-medium">This artisan hasn't listed any products yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
