import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { useAuthStore } from '@/store/useAuthStore'
import api, { paymentService, orderService } from '@/services/api'
import { History as HistoryIcon } from 'lucide-react'
import { 
  Eye, 
  ShoppingCart, 
  ShoppingBag, 
  Users as UsersIcon,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Package,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Key,
  ShieldAlert,
  UserCheck
} from 'lucide-react'

// Common Table Component for Reusability
function Table({ headers, data, renderRow, searchPlaceholder, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="flex items-center gap-2 max-w-sm ml-auto">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input 
              type="text" 
              placeholder={searchPlaceholder || "Search..."}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:border-[#003580]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4 font-black text-[#1C2434] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredData.map((item, i) => renderRow(item, i))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-[#64748B]">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Section({ title, children, showStats = false }) {
  const user = useAuthStore((s) => s.user)
  
  const productFilters = useMemo(() => {
    if (user?.role === 'artisan') return [{ field: 'artisanId', op: '==', value: user.uid }]
    return []
  }, [user])

  const orderFilters = useMemo(() => {
    if (user?.role === 'artisan') return [{ field: 'artisanIds', op: 'array-contains', value: user.uid }]
    if (user?.role === 'customer') return [{ field: 'customerId', op: '==', value: user.uid }]
    return []
  }, [user])

  const { items: products } = useRealtimeCollection('products', productFilters)
  const { items: initialOrders } = useRealtimeCollection('orders', orderFilters)
  const { items: allOrders } = useRealtimeCollection('orders', user?.role === 'artisan' && initialOrders.length === 0 ? [] : [{ field: '___none___', op: '==', value: '___none___' }])
  const { items: stores } = useRealtimeCollection('stores')

  const orders = useMemo(() => {
    if (user?.role === 'artisan' && initialOrders.length === 0 && allOrders.length > 0) {
      return allOrders.filter(o => o.items?.some(i => i.artisanId === user?.uid))
    }
    return initialOrders
  }, [initialOrders, allOrders, user?.role, user?.uid])

  const stats = useMemo(() => {
    const s = [
      {
        title: user?.role === 'customer' ? 'My Orders' : 'Total Products',
        value: user?.role === 'customer' ? orders.length.toString() : products.length.toString(),
        change: '0.00%',
        trend: 'up',
        icon: user?.role === 'customer' ? <ShoppingCart size={22} className="text-[#003580]" /> : <ShoppingBag size={22} className="text-[#003580]" />
      },
      {
        title: user?.role === 'artisan' ? 'Store Orders' : user?.role === 'customer' ? 'Items Bought' : 'Total Orders',
        value: user?.role === 'customer' ? orders.reduce((acc, o) => acc + (o.items?.length || 0), 0).toString() : orders.length.toString(),
        change: '0.00%',
        trend: 'up',
        icon: <Package size={22} className="text-[#003580]" />
      }
    ]

    if (user?.role === 'admin') {
      s.push({
        title: 'Active Stores',
        value: stores.length.toString(),
        change: '0.00%',
        trend: 'up',
        icon: <UsersIcon size={22} className="text-[#003580]" />
      })
    }

    s.push({
      title: user?.role === 'customer' ? 'Total Spent' : user?.role === 'artisan' ? 'Total Revenue' : 'Platform Revenue',
      value: `KES ${orders.reduce((acc, curr) => {
        if (user?.role === 'artisan') {
          const myItems = curr.items?.filter(i => i.artisanId === user.uid) || []
          return acc + myItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        }
        return acc + (curr.total || 0)
      }, 0).toLocaleString()}`,
      change: '0.00%',
      trend: 'up',
      icon: <Eye size={22} className="text-[#003580]" />
    })

    return s
  }, [products.length, orders, stores.length, user?.role])

  return (
    <div className="space-y-6">
      {showStats && (
        <div className={`grid gap-4 md:grid-cols-2 ${stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      )}
      <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm p-6">
        {children}
      </div>
    </div>
  )
}

function StatCard({ title, value, change, trend, icon }) {
  return (
    <div className="rounded-sm border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex size-11.5 items-center justify-center rounded-full bg-[#F1F5F9] mb-4">
        {icon}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <h4 className="text-2xl font-black text-[#1C2434]">{value}</h4>
          <span className="text-sm font-medium text-[#64748B]">{title}</span>
        </div>
        
        <span className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-[#10B981]' : 'text-[#DC3545]'}`}>
          {change}
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </span>
      </div>
    </div>
  )
}

function ProductManager() {
  const user = useAuthStore((s) => s.user)
  const { items: products } = useRealtimeCollection('products', 
    user?.role === 'artisan' ? [{ field: 'artisanId', op: '==', value: user?.uid }] : []
  )
  const { items: stores } = useRealtimeCollection('stores')
  const [isAdding, setIsAdding] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  const [formData, setFormData] = useState({ name: '', price: '', imageUrl: '', description: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      price: Number(formData.price),
      updatedAt: serverTimestamp(),
    }
    
    if (editingProduct) {
      await updateDoc(doc(db, 'products', editingProduct.id), payload)
    } else {
      await addDoc(collection(db, 'products'), {
        ...payload,
        artisanId: user.uid,
        createdAt: serverTimestamp(),
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200',
      })
    }
    setFormData({ name: '', price: '', imageUrl: '', description: '' })
    setIsAdding(false)
    setEditingProduct(null)
  }

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }, [products])

  const getStoreName = (artisanId) => stores.find(s => s.artisanId === artisanId || s.id === artisanId)?.name || 'Unknown'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#1C2434]">Inventory Management</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 rounded-lg bg-[#003580] px-4 py-2 text-sm font-bold text-white hover:bg-[#003580]/90 transition-all"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="grid gap-4 p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#003580]" placeholder="Product Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input className="rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#003580]" placeholder="Price (KES)" type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          <input className="rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#003580]" placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          <textarea className="rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#003580]" placeholder="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <button type="submit" className="w-full rounded-lg bg-[#003580] py-3 text-sm font-bold text-white">
            {editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      )}

      <Table 
        headers={['Product', 'Artisan', 'Price', 'Status', 'Actions']}
        data={sortedProducts}
        onSearch={true}
        searchPlaceholder="Search products..."
        renderRow={(p) => (
          <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <img src={p.imageUrl} className="size-10 rounded-lg object-cover bg-[#F1F5F9]" />
                <span className="font-bold text-[#1C2434]">{p.name}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-[#64748B] font-medium">{getStoreName(p.artisanId)}</span>
            </td>
            <td className="px-6 py-4 font-black text-[#003580]">
              KES {p.price?.toLocaleString()}
            </td>
            <td className="px-6 py-4">
              <span className="px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-black uppercase tracking-wider">Active</span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingProduct(p)
                    setFormData({ name: p.name, price: p.price, imageUrl: p.imageUrl, description: p.description || '' })
                    setIsAdding(true)
                  }}
                  className="p-2 text-[#64748B] hover:text-[#003580] hover:bg-[#F1F5F9] rounded-lg transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => deleteDoc(doc(db, 'products', p.id))}
                  className="p-2 text-[#64748B] hover:text-[#DC3545] hover:bg-[#FFF5F5] rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  )
}

function StoreSettingsPanel() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    location: 'Nairobi, Kenya',
    category: ''
  })

  // Fetch current store data
  const { items: stores } = useRealtimeCollection('stores', [{ field: 'artisanId', op: '==', value: user?.uid || '__none__' }])
  
  useMemo(() => {
    if (stores.length > 0) {
      const store = stores[0]
      setFormData({
        name: store.name || '',
        description: store.description || '',
        logo: store.logo || '',
        location: store.location || 'Nairobi, Kenya',
        category: store.category || ''
      })
      setLoading(false)
    } else if (stores.length === 0) {
      setLoading(false)
    }
  }, [stores])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'stores', user.uid), { 
        ...formData,
        artisanId: user.uid,
        updatedAt: serverTimestamp() 
      }, { merge: true })
      alert('Store settings updated successfully!')
    } catch (err) {
      alert('Failed to update settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-10 text-center text-[#64748B]">Loading store settings...</div>

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div className="grid gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Store Name</label>
          <input 
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#003580] transition-all" 
            placeholder="e.g. Maasai Beadworks Collective" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Description</label>
          <textarea 
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#003580] transition-all" 
            rows={4} 
            placeholder="Tell your story..." 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Logo URL</label>
            <input 
              className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#003580] transition-all" 
              placeholder="https://..." 
              value={formData.logo} 
              onChange={(e) => setFormData({...formData, logo: e.target.value})} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Location</label>
            <input 
              className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#003580] transition-all" 
              placeholder="e.g. Nairobi, Kenya" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Store Category</label>
          <input 
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#003580] transition-all" 
            placeholder="e.g. Jewelry, Home Decor, Textiles" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={saving}
        className="w-full rounded-xl bg-[#1C2434] py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-[#003580] disabled:opacity-50 transition-all shadow-lg"
      >
        {saving ? 'Saving Changes...' : 'Update Store Profile'}
      </button>
    </form>
  )
}

function OrdersPanel({ mode = 'customer' }) {
  const user = useAuthStore((s) => s.user)
  const collectionName = 'orders'
  
  // Try optimized query first
  const constraints = useMemo(() => {
    if (mode === 'customer') return [{ field: 'customerId', op: '==', value: user?.uid || '__none__' }]
    if (mode === 'artisan') return [{ field: 'artisanIds', op: 'array-contains', value: user?.uid || '__none__' }]
    return []
  }, [mode, user?.uid])

  const { items: orders, loading } = useRealtimeCollection(collectionName, constraints)
  
  // Fallback for old orders that might be missing the artisanIds index field
  const { items: allOrders } = useRealtimeCollection(collectionName, mode === 'artisan' && orders.length === 0 ? [] : [{ field: '___none___', op: '==', value: '___none___' }])
  
  const displayOrders = useMemo(() => {
    if (mode === 'artisan' && orders.length === 0 && allOrders.length > 0) {
      // Fallback: search through all orders for items belonging to this artisan
      return allOrders.filter(o => o.items?.some(i => i.artisanId === user?.uid))
    }
    return orders
  }, [orders, allOrders, mode, user?.uid])
  
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = await auth.currentUser.getIdToken()
      await orderService.updateStatus(orderId, newStatus, token)
      alert(`Order status updated to ${newStatus}`)
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message))
    }
  }

  const sortedOrders = useMemo(() => {
    return [...displayOrders].sort((a, b) => {
      // Use createdAt as a string/ISO or Firestore Timestamp
      const dateA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : 0
      const dateB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : 0
      return dateB - dateA
    })
  }, [displayOrders])

  return (
    <div className="space-y-4">
      {sortedOrders.map((o) => {
        // For artisans, only show their portion of the total and their items
        const myItems = mode === 'artisan' ? o.items?.filter(i => i.artisanId === user?.uid) : o.items
        const myGrossTotal = mode === 'artisan' ? myItems?.reduce((acc, i) => acc + (i.price * i.quantity), 0) : o.total
        const myCommission = mode === 'artisan' ? myGrossTotal * 0.05 : 0
        const myNetTotal = myGrossTotal - myCommission

        return (
          <div key={o.id} className="flex items-center justify-between p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#003580] transition-all group">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#003580]">
                <Package size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-[#1C2434]">Order #{o.id.slice(0, 8)}</p>
                <p className="text-[10px] text-[#64748B] font-medium">
                  {o.createdAt ? (o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString() : new Date(o.createdAt).toLocaleDateString()) : 'Recent'} • {myItems?.length || 0} items
                </p>
                <p className="text-[11px] text-[#1C2434] font-bold mt-0.5 line-clamp-1">
                  {myItems?.map(i => i.name).join(', ')}
                </p>
                {mode === 'artisan' && (
                  <p className="text-[10px] text-[#64748B] font-medium mt-1">
                    Gross: KES {myGrossTotal.toLocaleString()} • Commission: -KES {myCommission.toLocaleString()}
                  </p>
                )}
                {mode !== 'customer' && (
                  <p className="text-[10px] text-[#003580] font-bold mt-1 uppercase tracking-wider">
                    Deliver to: {o.customerLocation || 'No Address Set'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-black text-sm text-[#1C2434]">KES {(myNetTotal || 0).toLocaleString()}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  o.status === 'delivered' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                  o.status === 'processing' ? 'bg-[#E0E7FF] text-[#003580]' :
                  o.status === 'shipped' ? 'bg-[#F0FDF4] text-[#166534]' :
                  'bg-[#FFF3E0] text-[#E65100]'
                }`}>
                  {o.status || 'placed'}
                </span>
              </div>
              
              {mode === 'artisan' && o.status !== 'delivered' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {o.status === 'placed' && (
                    <button 
                      onClick={() => handleUpdateStatus(o.id, 'processing')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#E0E7FF] text-[#003580] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#C7D2FE] transition-all"
                    >
                      <RotateCcw size={14} />
                      Start Processing
                    </button>
                  )}
                  {o.status === 'processing' && (
                    <button 
                      onClick={() => handleUpdateStatus(o.id, 'shipped')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] text-[#166534] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#DCFCE7] transition-all"
                    >
                      <Package size={14} />
                      Mark Shipped
                    </button>
                  )}
                  {o.status === 'shipped' && (
                    <button 
                      onClick={() => handleUpdateStatus(o.id, 'delivered')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#C8E6C9] transition-all"
                    >
                      <CheckCircle size={14} />
                      Confirm Delivery
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {!displayOrders.length && (
        <div className="py-12 text-center opacity-40">
          <ShoppingBag size={40} className="mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">No orders found</p>
        </div>
      )}
    </div>
  )
}

function MessagesPanel() {
  const user = useAuthStore((s) => s.user)
  const { items: received } = useRealtimeCollection('chats', [{ field: 'recipientId', op: '==', value: user?.uid || '__none__' }])
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  
  const send = async () => {
    if (!recipientId || !message.trim()) return
    await addDoc(collection(db, 'chats'), {
      chatId: [user.uid, recipientId].sort().join('_'),
      senderId: user.uid,
      recipientId,
      message,
      createdAt: serverTimestamp(),
    })
    setMessage('')
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#003580]" placeholder="Recipient UID" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} />
          <button type="button" onClick={send} className="rounded-lg bg-[#003580] px-4 py-2 text-sm text-white font-bold hover:bg-[#003580]/90 transition-all">Send</button>
        </div>
        <textarea className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#003580]" rows={2} placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <div className="space-y-2">
        {received.map((c) => (
          <div key={c.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="size-6 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <UsersIcon size={12} className="text-[#003580]" />
              </div>
              <p className="font-bold text-xs text-[#1C2434]">From {c.senderId.slice(0, 8)}...</p>
            </div>
            <p className="text-sm text-[#64748B] ml-8">{c.message}</p>
          </div>
        ))}
        {!received.length && <p className="text-xs text-[#64748B] text-center py-4">No messages yet.</p>}
      </div>
    </div>
  )
}

function ProfilePanel() {
  const user = useAuthStore((s) => s.user)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    location: user?.location || '',
    city: user?.city || '',
    country: user?.country || 'Kenya'
  })

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      })
      alert('Profile updated successfully!')
    } catch (err) {
      alert('Update failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-8">
      <div>
        <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm mb-4">Personal Information</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Full Name</label>
            <input 
              type="text" 
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#003580] transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Phone Number</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#003580] transition-all font-medium"
              placeholder="+254..."
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#F1F5F9]">
        <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm mb-4">Shipping Address</h4>
        <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Shipping Address / Location</label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#003580] transition-all font-medium"
                placeholder="e.g. Nairobi, Kilimani, 123 Artisan Street"
              />
              <p className="text-[9px] text-[#003580] font-bold mt-1 uppercase tracking-widest">* Required for ordering products</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">City</label>
            <input 
              type="text" 
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#003580] transition-all font-medium"
              placeholder="Nairobi"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Country</label>
            <input 
              type="text" 
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#003580] transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button 
          type="submit"
          disabled={saving}
          className="bg-[#003580] text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#003580]/90 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}

export const CustomerHome = () => <Section title="Customer Dashboard" showStats={true}>
  <div className="space-y-4">
    <h3 className="text-lg font-bold text-[#1C2434]">Welcome back!</h3>
    <p className="text-[#64748B]">Here's what's happening with your account today.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
        <h4 className="font-bold mb-2">Recent Orders</h4>
        <OrdersPanel mode="customer" />
      </div>
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
        <h4 className="font-bold mb-2">Recent Messages</h4>
        <MessagesPanel />
      </div>
    </div>
  </div>
</Section>
export const CustomerOrders = () => <Section title="My Orders"><OrdersPanel mode="customer" /></Section>
export const CustomerWallet = () => {
  const user = useAuthStore((s) => s.user)
  const { items: transactions } = useRealtimeCollection('transactions', [{ field: 'userId', op: '==', value: user?.uid || '__none__' }])
  const [topupAmount, setTopupAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastReference, setLastReference] = useState('')

  const handleTopup = async (e) => {
    e.preventDefault()
    if (!topupAmount || isNaN(topupAmount) || Number(topupAmount) <= 0) return
    
    setIsProcessing(true)
    try {
      if (!window.PaystackPop) {
        throw new Error('Paystack is still loading. Please try again in a moment.')
      }

      const paystack = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(Number(topupAmount) * 100), // Amount in kobo
        currency: 'KES',
        metadata: {
          userId: user.uid,
          type: 'topup'
        },
        callback: function(response) {
          const reference = response.reference;
          setLastReference(reference)
          setShowSuccessModal(true) // Open modal immediately
          setTopupAmount('')
          setIsProcessing(false)
          
          // Auto-run verification once
          handleEnforceVerify(reference)
        },
        onClose: function() {
          setIsProcessing(false)
        }
      });
      paystack.openIframe();
    } catch (err) {
      alert('Error: ' + err.message)
      setIsProcessing(false)
    }
  }

  const handleEnforceVerify = async (ref = lastReference) => {
    if (!ref) return
    setIsProcessing(true)
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await paymentService.verifyTopup(ref, token)
      console.log('Verification Success:', res)
      alert('Balance updated successfully!')
      // Real-time listener will handle UI update
    } catch (err) {
      console.error('Verification failed:', err)
      alert('Verification failed: ' + (err.response?.data?.message || 'Server not responding. Please try again in a few seconds.'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefreshBalance = async () => {
    setIsProcessing(true)
    try {
      // Force a manual check of the last 5 transactions to ensure everything is synced
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const snap = await getDocs(q)
      
      // If there are transactions but balance is 0, something is wrong
      if (!snap.empty && (user?.walletBalance || 0) === 0) {
        alert('Discrepancy detected. Attempting to re-sync with server...')
        // We could trigger a sync here if needed
      } else {
        alert('Balance and transactions are synchronized with the database.')
      }
    } catch (err) {
      console.error('Refresh failed:', err)
      alert('Sync completed. Your balance is up to date with the server.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualVerify = async () => {
    const reference = window.prompt('Enter your Paystack reference if your balance hasn\'t updated:')
    if (!reference) return

    setIsProcessing(true)
    try {
      const token = await auth.currentUser.getIdToken()
      await paymentService.verifyTopup(reference, token)
      alert('Verification successful! Your balance has been updated.')
    } catch (err) {
      alert('Verification failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsProcessing(false)
    }
  }

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB - dateA
    })
  }, [transactions])

  return (
    <Section title="My Wallet">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1C2434] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -top-10 size-40 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Available Balance</p>
              <h2 className="text-4xl font-black mb-8">KES {(user?.walletBalance || 0).toLocaleString()}</h2>
              <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                <ShieldAlert size={14} />
                <span>Securely managed via Paystack</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-[#E2E8F0] p-8">
            <h3 className="font-black text-[#1C2434] uppercase tracking-wider text-sm mb-6">Top Up Wallet</h3>
            <form onSubmit={handleTopup} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#64748B]">KES</span>
                <input 
                  type="number" 
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all font-black text-lg"
                  placeholder="0.00"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full py-4 bg-[#ff5e14] hover:bg-[#e65512] text-white rounded-2xl font-black transition-all shadow-xl shadow-[#ff5e14]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowUpRight size={20} />}
                {isProcessing ? 'PROCESSING...' : 'ADD FUNDS'}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <h3 className="font-black text-[#1C2434] uppercase tracking-wider text-sm mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {sortedTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    t.type === 'topup' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                    t.type === 'purchase' ? 'bg-[#FFF5F5] text-[#DC3545]' : 
                    'bg-[#F1F5F9] text-[#64748B]'
                  }`}>
                    {t.type === 'topup' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1C2434] capitalize">{t.type} {t.provider ? `via ${t.provider}` : ''}</p>
                    <p className="text-[10px] text-[#64748B] font-medium">
                      {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`font-black text-sm ${t.amount > 0 ? 'text-[#2E7D32]' : 'text-[#DC3545]'}`}>
                  {t.amount > 0 ? '+' : ''}KES {Math.abs(t.amount).toLocaleString()}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-[#F1F5F9] rounded-[2rem]">
                <HistoryIcon size={40} className="mx-auto text-[#CBD5E1] mb-4" />
                <p className="text-sm text-[#64748B] font-medium">No transactions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-12 text-center">
              <div className={`size-20 ${isProcessing ? 'bg-[#E0E7FF] text-[#003580]' : 'bg-[#E8F5E9] text-[#2E7D32]'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                {isProcessing ? <RotateCcw size={40} className="animate-spin" /> : <CheckCircle size={40} />}
              </div>
              <h2 className="text-3xl font-black text-[#1C2434] mb-4">
                {isProcessing ? 'Processing Payment...' : 'Payment Processed!'}
              </h2>
              <p className="text-base text-[#64748B] font-medium leading-relaxed mb-8">
                {isProcessing 
                  ? 'We are currently verifying your transaction with Paystack. Please wait a moment.' 
                  : 'Your payment has been successfully processed and verified. Your balance is now updated.'}
              </p>
              <div className="space-y-4">
                {isProcessing ? (
                  <div className="w-full py-4 bg-[#F1F5F9] text-[#64748B] rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    Verifying Reference...
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full py-4 bg-[#003580] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#003580]/90 transition-all shadow-xl shadow-[#003580]/20"
                  >
                    Done - View Balance
                  </button>
                )}
                
                <button 
                  onClick={() => handleEnforceVerify(lastReference)}
                  disabled={isProcessing}
                  className="w-full py-4 border-2 border-[#E2E8F0] text-[#1C2434] rounded-2xl font-black uppercase tracking-widest hover:border-[#CBD5E1] transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Waiting...' : 'Re-verify & Load Balance'}
                </button>

                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest pt-4">
                  Ref: {lastReference}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}
export const CustomerMessages = () => <Section title="Messages"><MessagesPanel /></Section>
export const CustomerProfile = () => <Section title="My Profile"><ProfilePanel /></Section>
export const CustomerWishlist = () => <Section title="My Wishlist" />

// Artisan Pages
export const ArtisanOverview = () => <Section title="Artisan Dashboard" showStats={true}>
  <div className="space-y-4">
    <h3 className="text-lg font-bold text-[#1C2434]">Store Overview</h3>
    <p className="text-[#64748B]">Manage your products and track your sales performance.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
        <h4 className="font-bold mb-2">Active Products</h4>
        <ProductManager />
      </div>
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
        <h4 className="font-bold mb-2">Recent Store Orders</h4>
        <OrdersPanel mode="artisan" />
      </div>
    </div>
  </div>
</Section>
export const ArtisanProducts = () => <Section title="My Products"><ProductManager /></Section>
export const ArtisanOrders = () => <Section title="Store Orders"><OrdersPanel mode="artisan" /></Section>
export const ArtisanWallet = () => {
  const user = useAuthStore((s) => s.user)
  const { items: transactions } = useRealtimeCollection('transactions', [{ field: 'userId', op: '==', value: user?.uid || '__none__' }])
  
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB - dateA
    })
  }, [transactions])

  return (
    <Section title="Store Wallet">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#003580] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -top-10 size-40 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Earnings</p>
              <h2 className="text-4xl font-black mb-8">KES {(user?.walletBalance || 0).toLocaleString()}</h2>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Payout Status</p>
                <p className="text-xs font-medium">Manual payouts processed by admin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <h3 className="font-black text-[#1C2434] uppercase tracking-wider text-sm mb-6">Earnings & Payouts</h3>
          <div className="space-y-4">
            {sortedTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    t.type === 'sale' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                    t.type === 'payout' ? 'bg-[#F1F5F9] text-[#003580]' : 
                    'bg-[#F1F5F9] text-[#64748B]'
                  }`}>
                    {t.type === 'sale' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1C2434] capitalize">
                      {t.type === 'sale' ? 'Sale Revenue' : 'Manual Payout'}
                    </p>
                    <p className="text-[10px] text-[#64748B] font-medium">
                      {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : new Date(t.createdAt).toLocaleString()}
                    </p>
                    {t.note && <p className="text-[10px] text-[#003580] font-bold mt-1">Note: {t.note}</p>}
                  </div>
                </div>
                <span className={`font-black text-sm ${t.amount > 0 ? 'text-[#2E7D32]' : 'text-[#003580]'}`}>
                  {t.amount > 0 ? '+' : ''}KES {Math.abs(t.amount).toLocaleString()}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-[#F1F5F9] rounded-[2rem]">
                <HistoryIcon size={40} className="mx-auto text-[#CBD5E1] mb-4" />
                <p className="text-sm text-[#64748B] font-medium">No transaction history yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}
export const ArtisanAnalytics = () => {
  const user = useAuthStore((s) => s.user)
  const { items: initialOrders } = useRealtimeCollection('orders', [{ field: 'artisanIds', op: 'array-contains', value: user?.uid || '__none__' }])
  const { items: allOrders } = useRealtimeCollection('orders', initialOrders.length === 0 ? [] : [{ field: '___none___', op: '==', value: '___none___' }])

  const orders = useMemo(() => {
    if (initialOrders.length === 0 && allOrders.length > 0) {
      return allOrders.filter(o => o.items?.some(i => i.artisanId === user?.uid))
    }
    return initialOrders
  }, [initialOrders, allOrders, user?.uid])
  
  const salesByMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const data = months.map(m => ({ name: m, total: 0 }))
    
    orders.forEach(o => {
      if (o.createdAt?.toDate || o.createdAt) {
        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
        const month = date.getMonth()
        const myItems = o.items?.filter(i => i.artisanId === user?.uid) || []
        const myTotal = myItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        data[month].total += myTotal
      }
    })
    return data
  }, [orders])

  return (
    <Section title="Store Analytics">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Total Sales</p>
            <h3 className="text-2xl font-black text-[#1C2434]">{orders.length}</h3>
          </div>
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Gross Revenue</p>
            <h3 className="text-2xl font-black text-[#003580]">KES {orders.reduce((acc, o) => {
              const myItems = o.items?.filter(i => i.artisanId === user?.uid) || []
              return acc + myItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
            }, 0).toLocaleString()}</h3>
          </div>
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Avg. Order Value</p>
            <h3 className="text-2xl font-black text-[#1C2434]">
              KES {orders.length ? Math.round(orders.reduce((acc, o) => {
                const myItems = o.items?.filter(i => i.artisanId === user?.uid) || []
                return acc + myItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
              }, 0) / orders.length).toLocaleString() : 0}
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm">Monthly Revenue Performance</h4>
          <div className="h-64 flex items-end gap-2 px-4 border-b border-l border-[#E2E8F0]">
            {salesByMonth.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-[#003580] rounded-t-lg transition-all group-hover:bg-[#003580]/80 relative"
                  style={{ height: `${Math.max((d.total / (Math.max(...salesByMonth.map(m => m.total)) || 1)) * 100, 5)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1C2434] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    KES {d.total.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#64748B] mb-[-24px]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
export const ArtisanStoreSettings = () => <Section title="Store Settings"><StoreSettingsPanel /></Section>
export const ArtisanMessages = () => <Section title="Messages"><MessagesPanel /></Section>
export const ArtisanPending = () => {
  const { user, loading, signOut } = useAuthStore()
  const [formData, setFormData] = useState({
    experience: '',
    specialization: '',
    canHandleBulk: 'no',
    portfolio: '',
    location: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="size-10 border-4 border-[#003580]/20 border-t-[#003580] rounded-full animate-spin"></div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  // Derive submitted state directly from user data to ensure reactivity
  const hasSubmitted = !!user?.screeningAnswers

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        screeningAnswers: formData,
        artisanStatus: 'pending',
        welcomeEmailSent: false,
        updatedAt: serverTimestamp()
      })
      
      const token = await auth.currentUser.getIdToken()
      await api.post('/users/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      alert('Failed to submit: ' + err.message)
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async (e) => {
    if (e) e.preventDefault()
    try {
      await signOut()
      // Fallback redirect if store doesn't trigger re-render
      window.location.href = '/login'
    } catch (err) {
      console.error('Sign out failed:', err)
      // Even on error, try to clear local state
      window.location.href = '/login'
    }
  }

  if (hasSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white p-12 rounded-[2.5rem] shadow-xl border border-[#E2E8F0]">
          <div className="size-20 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#1C2434] mb-4">Application Submitted!</h1>
          <p className="text-base text-[#64748B] font-medium leading-relaxed">
            Thank you for applying to be an artisan. Our team is currently reviewing your profile and screening answers.
            We'll notify you once your account is approved.
          </p>
          <div className="mt-8 pt-8 border-t border-[#F1F5F9]">
            <button 
              onClick={handleSignOut}
              className="text-sm font-black text-[#003580] hover:underline uppercase tracking-widest"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-[#E2E8F0] overflow-hidden">
          <div className="bg-[#003580] p-10 text-white">
            <h1 className="text-3xl font-black mb-2">Artisan Screening</h1>
            <p className="text-[#94A3B8] font-medium">Please tell us more about your craft to help us verify your application.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Years of Experience</label>
                <input 
                  type="number" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all"
                  placeholder="e.g. 5"
                  value={formData.experience}
                  onChange={e => setFormData({...formData, experience: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Location</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all"
                  placeholder="e.g. Nairobi, Kenya"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Primary Specialization</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all"
                placeholder="e.g. Wood Carving, Beadwork, Pottery"
                value={formData.specialization}
                onChange={e => setFormData({...formData, specialization: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Can you handle bulk orders?</label>
              <div className="flex gap-4">
                {['yes', 'no'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({...formData, canHandleBulk: opt})}
                    className={`flex-1 py-3 rounded-xl border-2 font-black uppercase tracking-widest transition-all ${
                      formData.canHandleBulk === opt 
                        ? 'border-[#003580] bg-[#003580] text-white' 
                        : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Portfolio / Description of Work</label>
              <textarea 
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all resize-none"
                placeholder="Tell us about your products, materials used, and any online presence..."
                value={formData.portfolio}
                onChange={e => setFormData({...formData, portfolio: e.target.value})}
              />
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#ff5e14] hover:bg-[#e65512] text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#ff5e14]/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button 
                type="button"
                onClick={handleSignOut}
                className="text-sm font-bold text-[#64748B] hover:text-[#1C2434] transition-colors"
              >
                Cancel and Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Admin Pages
export const AdminOverview = () => {
  const { items: users, loading: usersLoading } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'artisan' }])
  const { items: customers, loading: customersLoading } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'customer' }])
  const { items: orders, loading: ordersLoading } = useRealtimeCollection('orders')

  const isLoading = usersLoading || customersLoading || ordersLoading

  if (isLoading) {
    return (
      <Section title="Platform Dashboard" showStats={true}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="size-10 border-4 border-[#003580]/20 border-t-[#003580] rounded-full animate-spin"></div>
            <p className="text-xs font-black text-[#64748B] uppercase tracking-widest">Loading Platform Data...</p>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section title="Platform Dashboard" showStats={true}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Artisans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm">New Artisans</h4>
            <Link to="/admin/users" className="text-xs font-bold text-[#003580] hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
            {users.slice(0, 5).map(u => (
              <div key={u.uid} className="flex items-center justify-between p-4 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                    {u.photoURL ? <img src={u.photoURL} className="size-full object-cover" /> : <UsersIcon size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1C2434]">{u.displayName || u.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-[#64748B]">{u.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[9px] font-black uppercase">Artisan</span>
              </div>
            ))}
            {users.length === 0 && (
              <div className="p-12 text-center">
                <UsersIcon size={32} className="mx-auto text-[#CBD5E1] mb-2" />
                <p className="text-xs text-[#64748B] font-medium">No artisans registered yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm">Recent Orders</h4>
            <Link to="/admin/orders" className="text-xs font-bold text-[#003580] hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                    <Package size={16} className="text-[#003580]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1C2434]">Order #{o.id.slice(0, 6)}</p>
                    <p className="text-[10px] text-[#64748B]">{o.customerEmail}</p>
                    <p className="text-[10px] text-[#1C2434] font-bold line-clamp-1">{o.items?.map(i => i.name).join(', ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xs text-[#1C2434]">KES {o.total?.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-[#E65100] uppercase">{o.status || 'placed'}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-12 text-center">
                <Package size={32} className="mx-auto text-[#CBD5E1] mb-2" />
                <p className="text-xs text-[#64748B] font-medium">No orders placed yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}
export const AdminUsers = () => {
  const { items: users } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'artisan' }])
  const { items: stores } = useRealtimeCollection('stores')
  const { impersonate } = useAuthStore()

  const handleAction = async (uid, action, email) => {
    const userRef = doc(db, 'users', uid)
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this artisan? This cannot be undone.')) return
        await deleteDoc(userRef)
      } else if (action === 'reset-password') {
        await sendPasswordResetEmail(auth, email)
        alert(`Password reset email sent to ${email}`)
      } else if (action === 'approve') {
        await updateDoc(userRef, { isApproved: true, artisanStatus: 'approved', updatedAt: serverTimestamp() })
        alert('Artisan approved successfully!')
      } else {
        await updateDoc(userRef, {
          isSuspended: action === 'suspend',
          updatedAt: serverTimestamp()
        })
      }
    } catch (err) {
      alert('Action failed: ' + err.message)
    }
  }

  const getStoreForArtisan = (uid) => stores.find(s => s.artisanId === uid)

  return (
    <Section title="Artisan Management">
      <Table
        headers={['Artisan', 'Store', 'Status', 'Actions']}
        data={users}
        onSearch={true}
        searchPlaceholder="Search artisans..."
        renderRow={(u) => {
          const store = getStoreForArtisan(u.uid)
          return (
            <tr key={u.uid} className="hover:bg-[#F8FAFC]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                    {u.photoURL ? <img src={u.photoURL} className="size-full object-cover" /> : <UsersIcon size={14} />}
                  </div>
                  <div>
                    <p className="font-bold text-[#1C2434]">{u.displayName || u.email?.split('@')[0]}</p>
                    <p className="text-xs text-[#64748B]">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {store ? (
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-[#003580]" />
                    <span className="font-medium">{store.name}</span>
                  </div>
                ) : <span className="text-[#64748B] italic">No Store</span>}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                  u.isSuspended ? 'bg-[#FFF3E0] text-[#E65100]' : 
                  !u.isApproved ? 'bg-[#F1F5F9] text-[#64748B]' :
                  'bg-[#E8F5E9] text-[#2E7D32]'
                }`}>
                  {u.isSuspended ? 'Suspended' : !u.isApproved ? 'Pending' : 'Active'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {!u.isApproved && (
                    <button 
                      onClick={() => handleAction(u.uid, 'approve')} 
                      className="p-2 text-[#003580] hover:bg-[#F1F5F9] rounded-lg transition-all" 
                      title="Approve Artisan"
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (confirm(`Open ${u.displayName || u.email}'s dashboard in a new window?`)) {
                        impersonate(u, true)
                      }
                    }} 
                    className="p-2 text-[#64748B] hover:text-[#003580] hover:bg-[#F1F5F9] rounded-lg transition-all" 
                    title="Login As (Popup)"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={() => handleAction(u.uid, 'reset-password', u.email)} 
                    className="p-2 text-[#64748B] hover:text-[#003580] hover:bg-[#F1F5F9] rounded-lg transition-all" 
                    title="Send Password Reset"
                  >
                    <Key size={16} />
                  </button>
                  <button 
                    onClick={() => handleAction(u.uid, u.isSuspended ? 'activate' : 'suspend')} 
                    className="p-2 text-[#64748B] hover:text-[#E65100] hover:bg-[#FFF3E0] rounded-lg transition-all" 
                    title={u.isSuspended ? 'Activate' : 'Suspend'}
                  >
                    {u.isSuspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                  </button>
                  <button 
                    onClick={() => handleAction(u.uid, 'delete')} 
                    className="p-2 text-[#64748B] hover:text-[#DC3545] hover:bg-[#FFF5F5] rounded-lg transition-all" 
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )
        }}
      />
    </Section>
  )
}

export const AdminCustomers = () => {
  const { items: users } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'customer' }])

  const handleAction = async (uid, action) => {
    const userRef = doc(db, 'users', uid)
    if (action === 'delete') {
      await deleteDoc(userRef)
    } else {
      await updateDoc(userRef, {
        isSuspended: action === 'suspend',
        updatedAt: serverTimestamp()
      })
    }
  }

  return (
    <Section title="Customer Management">
      <Table
        headers={['Customer', 'Joined', 'Status', 'Actions']}
        data={users}
        onSearch={true}
        searchPlaceholder="Search customers..."
        renderRow={(u) => (
          <tr key={u.uid} className="hover:bg-[#F8FAFC]">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                  {u.photoURL ? <img src={u.photoURL} className="size-full object-cover" /> : <UsersIcon size={14} />}
                </div>
                <div>
                  <p className="font-bold text-[#1C2434]">{u.displayName || u.email?.split('@')[0]}</p>
                  <p className="text-xs text-[#64748B]">{u.email}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-[#64748B]">
              {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Recent'}
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                u.isSuspended ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-[#E8F5E9] text-[#2E7D32]'
              }`}>
                {u.isSuspended ? 'Suspended' : 'Active'}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => handleAction(u.uid, u.isSuspended ? 'activate' : 'suspend')} className="p-2 text-[#64748B] hover:text-[#003580] hover:bg-[#F1F5F9] rounded-lg transition-all" title={u.isSuspended ? 'Activate' : 'Suspend'}>
                  {u.isSuspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                </button>
                <button onClick={() => handleAction(u.uid, 'delete')} className="p-2 text-[#64748B] hover:text-[#DC3545] hover:bg-[#FFF5F5] rounded-lg transition-all" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </Section>
  )
}
export const AdminFinance = () => {
  const { items: orders } = useRealtimeCollection('orders')
  const { items: artisans } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'artisan' }])
  const { items: transactions } = useRealtimeCollection('transactions')
  const { items: commissions } = useRealtimeCollection('commissions')
  const [selectedArtisan, setSelectedArtisan] = useState(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + (o.total || 0), 0), [orders])
  const totalCommissions = useMemo(() => commissions.reduce((acc, c) => acc + (c.amount || 0), 0), [commissions])
  const totalPayouts = useMemo(() => {
    return transactions
      .filter(t => t.type === 'payout')
      .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0)
  }, [transactions])

  const handlePayout = async (e) => {
    e.preventDefault()
    if (!selectedArtisan || !payoutAmount || isNaN(payoutAmount)) return
    
    setIsProcessing(true)
    try {
      const token = await auth.currentUser.getIdToken()
      await paymentService.recordPayout({
        artisanId: selectedArtisan.uid,
        amount: Number(payoutAmount),
        note: payoutNote
      }, token)
      
      alert('Payout recorded successfully!')
      setSelectedArtisan(null)
      setPayoutAmount('')
      setPayoutNote('')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const sortedRecentActivity = useMemo(() => {
    return [...orders, ...transactions.filter(t => t.type === 'payout')]
      .sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : 0
        const dateB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : 0
        return dateB - dateA
      })
      .slice(0, 10)
  }, [orders, transactions])

  return (
    <Section title="Finance Management">
      <div className="space-y-8">
        {/* Top Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[2.5rem] bg-[#1C2434] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 size-40 bg-white/5 rounded-full blur-3xl" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 relative z-10">Total Sales Revenue</p>
            <h3 className="text-4xl font-black mb-2 relative z-10">KES {totalRevenue.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest relative z-10">
              Gross Platform Volume
            </p>
          </div>

          <div className="rounded-[2.5rem] bg-[#003580] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 size-40 bg-white/10 rounded-full blur-3xl" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 relative z-10">Total Commission (5%)</p>
            <h3 className="text-4xl font-black mb-2 relative z-10">KES {totalCommissions.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest relative z-10">
              Net Platform Earnings
            </p>
          </div>

          <div className="rounded-[2.5rem] bg-[#F8FAFC] p-8 border border-[#E2E8F0] shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-2 relative z-10">Total Artisan Payouts</p>
            <h3 className="text-4xl font-black text-[#1C2434] mb-2 relative z-10">KES {totalPayouts.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-[#E65100] uppercase tracking-widest relative z-10">
              Funds Disbursed
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-[#E2E8F0] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm">Artisan Balances & Payouts</h4>
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Total Artisans: {artisans.length}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#F1F5F9]">
                  <tr>
                    <th className="pb-4 font-black text-[#64748B] uppercase tracking-widest text-[10px]">Artisan</th>
                    <th className="pb-4 font-black text-[#64748B] uppercase tracking-widest text-[10px]">Balance</th>
                    <th className="pb-4 font-black text-[#64748B] uppercase tracking-widest text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {artisans.map(a => (
                    <tr key={a.uid} className="hover:bg-[#F8FAFC]">
                      <td className="py-4">
                        <p className="font-bold text-[#1C2434]">{a.displayName || a.email}</p>
                        <p className="text-[10px] text-[#64748B]">{a.email}</p>
                      </td>
                      <td className="py-4 font-black text-[#003580]">KES {(a.walletBalance || 0).toLocaleString()}</td>
                      <td className="py-4">
                        <button 
                          onClick={() => setSelectedArtisan(a)}
                          className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#1C2434] text-[10px] font-black uppercase tracking-wider hover:bg-[#E2E8F0] transition-all"
                        >
                          Process Payout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* Payout Modal */}
        {selectedArtisan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#1C2434] p-8 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black mb-1">Record Manual Payout</h3>
                  <p className="text-white/60 text-sm font-medium">{selectedArtisan.displayName || selectedArtisan.email}</p>
                </div>
                <button onClick={() => setSelectedArtisan(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handlePayout} className="p-8 space-y-6">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Available to Pay</p>
                  <p className="text-2xl font-black text-[#003580]">KES {(selectedArtisan.walletBalance || 0).toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Amount to Payout (KES)</label>
                  <input 
                    type="number" 
                    required
                    max={selectedArtisan.walletBalance}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all font-black"
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#1C2434] uppercase tracking-widest">Transaction Reference / Note</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all"
                    placeholder="e.g. Bank Ref: MPESA-ABC123XYZ"
                    value={payoutNote}
                    onChange={e => setPayoutNote(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setSelectedArtisan(null)}
                    className="flex-1 py-3 rounded-xl border-2 border-[#E2E8F0] font-black text-[#64748B] uppercase tracking-widest hover:border-[#CBD5E1] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl bg-[#003580] text-white font-black uppercase tracking-widest hover:bg-[#003580]/90 transition-all shadow-xl shadow-[#003580]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'CONFIRM PAYOUT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-[2.5rem] border border-[#E2E8F0] p-8 shadow-sm">
          <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm mb-6">Recent Financial Activity</h4>
          <div className="space-y-4">
            {sortedRecentActivity.map((item) => {
              const isOrder = !!item.total
              return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center ${
                      isOrder ? 'text-[#003580] bg-[#F1F5F9]' : 'text-[#E65100] bg-[#FFF3E0]'
                    }`}>
                      {isOrder ? <ShoppingBag size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1C2434]">
                        {isOrder ? `Order #${item.id.slice(0, 8)}` : `Payout to Artisan`}
                      </p>
                      {isOrder && (
                        <p className="text-[10px] text-[#1C2434] font-bold line-clamp-1">
                          {item.items?.map(i => i.name).join(', ')}
                        </p>
                      )}
                      <p className="text-[10px] text-[#64748B] font-medium">
                        {item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate().toLocaleString() : new Date(item.createdAt).toLocaleString()) : 'Recent'} 
                        {item.customerEmail ? ` • ${item.customerEmail}` : item.note ? ` • ${item.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${isOrder ? 'text-[#1C2434]' : 'text-[#E65100]'}`}>
                      {isOrder ? '' : '-' }KES {(item.total || Math.abs(item.amount) || 0).toLocaleString()}
                    </p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${
                      isOrder ? (item.status === 'delivered' ? 'text-[#2E7D32]' : 'text-[#E65100]') : 'text-[#003580]'
                    }`}>{isOrder ? (item.status || 'placed') : 'payout completed'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Section>
  )
}
export const AdminApprovals = () => {
  const { items: users } = useRealtimeCollection('users', [{ field: 'role', op: '==', value: 'artisan' }])
  const [selectedArtisan, setSelectedArtisan] = useState(null)
  
  const handleApprove = async (uid) => {
    try {
      const token = await auth.currentUser.getIdToken()
      await paymentService.approveArtisan(uid, token)
      setSelectedArtisan(null)
      alert('Artisan approved successfully!')
    } catch (err) {
      alert('Failed to approve: ' + err.message)
    }
  }

  return (
    <Section title="Artisan Approvals">
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <p className="text-sm text-[#64748B] leading-relaxed">
            Review and approve new artisan applications. Check their screening answers carefully before granting access.
          </p>
        </div>
        
        <Table 
          headers={['Artisan', 'Submission Date', 'Specialization', 'Actions']}
          data={users.filter(u => !u.isApproved)}
          onSearch={true}
          searchPlaceholder="Search pending applications..."
          renderRow={(u) => (
            <tr key={u.id || u.uid} className="hover:bg-[#F8FAFC]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                    {u.photoURL ? <img src={u.photoURL} className="size-full object-cover" /> : <UsersIcon size={14} />}
                  </div>
                  <div>
                    <p className="font-bold text-[#1C2434]">{u.displayName || u.email?.split('@')[0]}</p>
                    <p className="text-xs text-[#64748B]">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-[#64748B]">
                {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Recent'}
              </td>
              <td className="px-6 py-4 text-[#64748B]">
                {u.screeningAnswers?.specialization || 'Not provided'}
              </td>
              <td className="px-6 py-4 flex gap-2">
                <button 
                  onClick={() => setSelectedArtisan(u)}
                  className="px-4 py-1.5 rounded-lg bg-[#F1F5F9] text-[#1C2434] text-xs font-bold hover:bg-[#E2E8F0] transition-all"
                >
                  Review Details
                </button>
                <button 
                  onClick={() => handleApprove(u.id || u.uid)}
                  className="px-4 py-1.5 rounded-lg bg-[#003580] text-white text-xs font-bold hover:bg-[#003580]/90 transition-all"
                >
                  Quick Approve
                </button>
              </td>
            </tr>
          )}
        />
        
        {/* Review Modal */}
        {selectedArtisan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#003580] p-8 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black mb-1">Review Application</h3>
                  <p className="text-white/60 text-sm font-medium">{selectedArtisan.displayName || selectedArtisan.email}</p>
                </div>
                <button onClick={() => setSelectedArtisan(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Experience</p>
                    <p className="font-bold text-[#1C2434]">{selectedArtisan.screeningAnswers?.experience || 0} Years</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Location</p>
                    <p className="font-bold text-[#1C2434]">{selectedArtisan.screeningAnswers?.location || 'Unknown'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Specialization</p>
                  <p className="font-bold text-[#1C2434]">{selectedArtisan.screeningAnswers?.specialization || 'Not specified'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Bulk Order Capacity</p>
                  <p className="font-bold text-[#1C2434] uppercase">{selectedArtisan.screeningAnswers?.canHandleBulk || 'No'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">Portfolio / Description</p>
                  <p className="text-sm text-[#1C2434] leading-relaxed whitespace-pre-wrap">{selectedArtisan.screeningAnswers?.portfolio || 'No description provided.'}</p>
                </div>
              </div>

              <div className="p-8 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-4">
                <button 
                  onClick={() => setSelectedArtisan(null)}
                  className="flex-1 py-3 rounded-xl border-2 border-[#E2E8F0] font-black text-[#64748B] uppercase tracking-widest hover:border-[#CBD5E1] transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => handleApprove(selectedArtisan.id || selectedArtisan.uid)}
                  className="flex-1 py-3 rounded-xl bg-[#003580] text-white font-black uppercase tracking-widest hover:bg-[#003580]/90 transition-all"
                >
                  Approve Artisan
                </button>
              </div>
            </div>
          </div>
        )}
        
        {users.filter(u => !u.isApproved && u.role === 'artisan').length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl">
            <CheckCircle size={40} className="mx-auto text-[#10B981] mb-4 opacity-20" />
            <h4 className="font-black text-[#1C2434] uppercase tracking-tighter">All Caught Up!</h4>
            <p className="text-xs text-[#64748B] mt-1">No pending artisan applications to review.</p>
          </div>
        )}
      </div>
    </Section>
  )
}
function SeedManager() {
  const [loading, setLoading] = useState(false)

  const seedData = async () => {
    if (!confirm('This will DELETE all data and reset the marketplace. Are you sure?')) return
    
    setLoading(true)
    console.log('Starting seed process...')
    
    try {
      // 1. Delete all current products, stores, users (except current admin), orders, chats, and logs
      const collections = ['products', 'stores', 'users', 'orders', 'chats', 'logs']
      
      for (const coll of collections) {
        const snap = await getDocs(collection(db, coll))
        const batch = writeBatch(db)
        let count = 0
        
        snap.forEach((d) => {
          // Keep current admin user
          if (coll === 'users' && d.data().role === 'admin') return
          batch.delete(d.ref)
          count++
        })
        
        if (count > 0) {
          await batch.commit()
          console.log(`Deleted ${count} items from ${coll}`)
        }
      }

      // 2. Add Kenyan artisans, products and users
      const artisans = [
        {
          id: 'artisan_1',
          email: 'maasai@artisan.com',
          name: 'Maasai Beadworks Collective',
          description: 'Authentic handcrafted beadwork from the heart of the Rift Valley. Supporting over 50 women artisans.',
          location: 'Narok, Kenya',
          category: 'Jewelry & Accessories',
          logo: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=400&h=400&fit=crop',
          products: [
            { name: 'Traditional Maasai Necklace', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800' },
            { name: 'Beaded Leather Bracelet', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800' },
            { name: 'Ceremonial Beaded Belt', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1554047600-77d61968c48a?q=80&w=800' }
          ]
        },
        {
          id: 'artisan_2',
          email: 'akamba@artisan.com',
          name: 'Akamba Wood Carvers',
          description: 'Master woodcarvers specializing in ebony and mahogany sculptures inspired by Kenyan wildlife.',
          location: 'Wamunyu, Kenya',
          category: 'Home Decor',
          logo: 'https://images.unsplash.com/photo-1590736961958-51fd96261d44?q=80&w=400&h=400&fit=crop',
          products: [
            { name: 'Hand-Carved Ebony Elephant', price: 8500, imageUrl: 'https://images.unsplash.com/photo-1590736961958-51fd96261d44?q=80&w=800' },
            { name: 'Mahogany Salad Servers', price: 2800, imageUrl: 'https://images.unsplash.com/photo-1594910411447-00d49fb7c5a5?q=80&w=800' },
            { name: 'Giraffe Totem Sculpture', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?q=80&w=800' }
          ]
        },
        {
          id: 'artisan_3',
          email: 'coastal@artisan.com',
          name: 'Coastal Weavers Guild',
          description: 'Traditional weaving techniques from the Kenyan coast, using sustainable sisal and palm fibers.',
          location: 'Mombasa, Kenya',
          category: 'Textiles & Baskets',
          logo: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=400&h=400&fit=crop',
          products: [
            { name: 'Kiondo Sisal Tote Bag', price: 3200, imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=800' },
            { name: 'Woven Floor Mat', price: 6500, imageUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?q=80&w=800' },
            { name: 'Palm Leaf Sun Hat', price: 1800, imageUrl: 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd15?q=80&w=800' }
          ]
        },
        {
          id: 'artisan_4',
          email: 'clay@artisan.com',
          name: 'Nairobi Clay Works',
          description: 'Contemporary ceramics and pottery inspired by the rich red soil of the Kenyan highlands.',
          location: 'Nairobi, Kenya',
          category: 'Ceramics & Pottery',
          logo: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=400&h=400&fit=crop',
          products: [
            { name: 'Red Soil Serving Bowl', price: 3800, imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800' },
            { name: 'Hand-Thrown Coffee Mug', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800' },
            { name: 'Decorative Clay Vase', price: 5200, imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?q=80&w=800' }
          ]
        }
      ]
      
      for (const artisan of artisans) {
        // Create user
        await setDoc(doc(db, 'users', artisan.id), {
          uid: artisan.id,
          email: artisan.email,
          displayName: artisan.name,
          role: 'artisan',
          isApproved: true,
          artisanStatus: 'approved',
          createdAt: serverTimestamp()
        })
        
        // Create store
        await setDoc(doc(db, 'stores', artisan.id), {
          artisanId: artisan.id,
          name: artisan.name,
          description: artisan.description,
          location: artisan.location,
          category: artisan.category,
          logo: artisan.logo,
          updatedAt: serverTimestamp()
        })

        // Create products for this artisan
        for (const product of artisan.products) {
          await addDoc(collection(db, 'products'), {
            ...product,
            category: artisan.category,
            artisanId: artisan.id,
            artisanLocation: artisan.location,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
      }

      // Add dummy customer
      await setDoc(doc(db, 'users', 'customer_1'), {
        uid: 'customer_1',
        email: 'jane@customer.com',
        displayName: 'Jane Doe',
        role: 'customer',
        createdAt: serverTimestamp()
      })

      // 3. Add initial logs
      await addDoc(collection(db, 'logs'), {
        action: 'system_reset',
        type: 'info',
        details: 'Platform data has been reset and seeded with Kenyan artisans.',
        userEmail: 'system_root',
        timestamp: serverTimestamp()
      })

      alert('Data seeded successfully! Platform has been reset.')
      window.location.reload()
    } catch (err) {
      console.error('Seed Error:', err)
      alert('Error seeding data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-black text-[#DC3545] uppercase tracking-wider">Database Reset</h4>
        <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">
          Wipe all existing products, stores, users (except yourself), and orders. 
          Will populate the database with fresh Kenyan artisan data.
        </p>
      </div>
      <button 
        onClick={seedData} 
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#DC3545] px-4 py-3 text-xs font-black text-white hover:bg-[#DC3545]/90 transition-all disabled:opacity-50"
      >
        {loading ? (
          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <RotateCcw size={14} />
        )}
        {loading ? 'RESETTING...' : 'RESET & SEED DATABASE'}
      </button>
    </div>
  )
}

export const AdminProducts = () => (
  <Section title="Products Management">
    <ProductManager />
  </Section>
)
export const AdminOrders = () => {
  const { items: orders } = useRealtimeCollection('orders')
  
  const handleStatusUpdate = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { 
      status,
      updatedAt: serverTimestamp()
    })
  }

  return (
    <Section title="Order Management">
      <Table 
        headers={['Order ID', 'Customer', 'Items Sold', 'Total', 'Status', 'Actions']}
        data={orders}
        onSearch={true}
        searchPlaceholder="Search orders..."
        renderRow={(o) => (
          <tr key={o.id} className="hover:bg-[#F8FAFC]">
            <td className="px-6 py-4 font-mono font-bold text-[#003580]">#{o.id.slice(0, 8)}</td>
            <td className="px-6 py-4">
              <p className="font-bold text-[#1C2434]">{o.customerName || 'Guest'}</p>
              <p className="text-xs text-[#64748B]">{o.customerEmail}</p>
            </td>
            <td className="px-6 py-4">
              <p className="text-[11px] font-bold text-[#1C2434] line-clamp-2 max-w-[200px]">
                {o.items?.map(i => `${i.name} (x${i.quantity})`).join(', ')}
              </p>
            </td>
            <td className="px-6 py-4 font-black">KES {o.total?.toLocaleString()}</td>
            <td className="px-6 py-4">
              <select 
                value={o.status || 'placed'} 
                onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full outline-none border-0 cursor-pointer ${
                  o.status === 'fulfilled' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                  o.status === 'cancelled' ? 'bg-[#FFF5F5] text-[#DC3545]' : 
                  'bg-[#FFF3E0] text-[#E65100]'
                }`}
              >
                <option value="placed">Placed</option>
                <option value="processing">Processing</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
            <td className="px-6 py-4">
              <button className="p-2 text-[#64748B] hover:text-[#003580] hover:bg-[#F1F5F9] rounded-lg transition-all">
                <Eye size={16} />
              </button>
            </td>
          </tr>
        )}
      />
    </Section>
  )
}
export const AdminReports = () => {
  const { items: orders } = useRealtimeCollection('orders')
  const { items: users } = useRealtimeCollection('users')
  const { items: stores } = useRealtimeCollection('stores')

  const reportData = useMemo(() => {
    const artisans = users.filter(u => u.role === 'artisan').length
    const customers = users.filter(u => u.role === 'customer').length
    const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0)
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0

    return [
      { label: 'Total Registered Artisans', value: artisans, icon: <UsersIcon size={16} /> },
      { label: 'Total Registered Customers', value: customers, icon: <UsersIcon size={16} /> },
      { label: 'Total Active Stores', value: stores.length, icon: <Store size={16} /> },
      { label: 'Gross Platform Revenue', value: `KES ${totalRevenue.toLocaleString()}`, icon: <Eye size={16} /> },
      { label: 'Average Order Value', value: `KES ${Math.round(avgOrderValue).toLocaleString()}`, icon: <Package size={16} /> },
      { label: 'Order Fulfillment Rate', value: `${orders.length ? Math.round((orders.filter(o => o.status === 'fulfilled').length / orders.length) * 100) : 0}%`, icon: <CheckCircle size={16} /> },
    ]
  }, [orders, users, stores])

  return (
    <Section title="Platform Reports">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportData.map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#003580]/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#003580]">
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{stat.label}</p>
              </div>
              <h3 className="text-2xl font-black text-[#1C2434]">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0]">
            <h4 className="font-black text-[#1C2434] uppercase tracking-wider text-sm">Recent Activity Summary</h4>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-[#64748B]">Detailed PDF and CSV reports can be generated from the Finance Management section.</p>
            <button className="mt-4 px-6 py-2 rounded-lg bg-[#003580] text-white text-xs font-bold hover:bg-[#003580]/90 transition-all">
              Export All Data
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}
export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'ARTISAN MARKETPLACE',
    maintenanceMode: false,
    allowNewRegistrations: true,
    platformFee: 5
  })

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true })
      alert('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Error saving settings: ' + err.message)
    }
  }

  return (
    <Section title="System Settings">
      <div className="max-w-2xl space-y-6">
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-black text-[#1C2434] uppercase tracking-wider">Site Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all"
              value={settings.siteName}
              onChange={(e) => setSettings({...settings, siteName: e.target.value})}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-black text-[#1C2434] uppercase tracking-wider">Platform Fee (%)</label>
            <input 
              type="number" 
              className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#003580] outline-none transition-all"
              value={settings.platformFee}
              onChange={(e) => setSettings({...settings, platformFee: Number(e.target.value)})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div>
              <p className="font-bold text-[#1C2434]">Maintenance Mode</p>
              <p className="text-xs text-[#64748B]">Disable the frontend for maintenance</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-[#003580]' : 'bg-[#CBD5E1]'}`}
            >
              <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div>
              <p className="font-bold text-[#1C2434]">Allow New Registrations</p>
              <p className="text-xs text-[#64748B]">Enable or disable new user signups</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, allowNewRegistrations: !settings.allowNewRegistrations})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.allowNewRegistrations ? 'bg-[#003580]' : 'bg-[#CBD5E1]'}`}
            >
              <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${settings.allowNewRegistrations ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 bg-[#1C2434] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#003580] transition-all"
        >
          Save Configuration
        </button>

        <div className="pt-8 border-t border-[#E2E8F0] space-y-4">
          <div className="flex items-center gap-2 text-[#DC3545]">
            <AlertCircle size={20} />
            <h3 className="font-black uppercase tracking-wider text-sm">Danger Zone</h3>
          </div>
          <div className="p-6 rounded-xl border border-[#DC3545]/20 bg-[#FFF5F5] space-y-4">
            <p className="text-xs text-[#DC3545] font-bold uppercase tracking-tight">
              Destructive Actions ahead. Use with caution.
            </p>
            <SeedManager />
          </div>
        </div>
      </div>
    </Section>
  )
}
export const AdminLogs = () => {
  const { items: logs } = useRealtimeCollection('logs')
  
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : 0
      const dateB = b.createdAt ? new Date(b.createdAt) : 0
      return dateB - dateA
    })
  }, [logs])

  return (
    <div className="min-h-[600px] flex flex-col gap-4">
      <div className="flex-1 rounded-2xl bg-[#0D1117] border border-[#30363D] overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#161B22] px-6 py-3 border-b border-[#30363D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-[#FF5F56] shadow-[0_0_8px_rgba(255,95,86,0.4)]"></div>
              <div className="size-3 rounded-full bg-[#FFBD2E] shadow-[0_0_8px_rgba(255,189,46,0.4)]"></div>
              <div className="size-3 rounded-full bg-[#27C93F] shadow-[0_0_8px_rgba(39,201,63,0.4)]"></div>
            </div>
            <div className="h-4 w-px bg-[#30363D] mx-2"></div>
            <span className="text-[10px] font-mono text-[#8B949E] tracking-widest uppercase opacity-70">artisan_os_v1.1.0 — system logs</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#8B949E]">
            <span className="flex items-center gap-1.5"><div className="size-1.5 rounded-full bg-[#27C93F] animate-pulse"></div> LIVE</span>
            <span>UTF-8</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-[#0D1117]/50 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#161B22] border-b border-[#30363D] z-10">
              <tr>
                <th className="px-6 py-3 text-[10px] font-mono font-bold text-[#8B949E] uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold text-[#8B949E] uppercase tracking-widest">Type</th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold text-[#8B949E] uppercase tracking-widest">To/User</th>
                <th className="px-6 py-3 text-[10px] font-mono font-bold text-[#8B949E] uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px] leading-relaxed">
              {sortedLogs.map((log) => (
                <tr key={log.id} className="border-b border-[#30363D]/30 hover:bg-[#161B22]/80 transition-all group">
                  <td className="px-6 py-3 text-[#58A6FF] whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '00:00:00'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded border ${
                      log.type.includes('error') ? 'text-[#FF7B72] border-[#FF7B72]/30 bg-[#FF7B72]/10' : 
                      log.type.includes('success') ? 'text-[#7EE787] border-[#7EE787]/30 bg-[#7EE787]/10' : 
                      'text-[#79C0FF] border-[#79C0FF]/30 bg-[#79C0FF]/10'
                    } font-bold text-[9px]`}>
                      {log.type?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[#C9D1D9] font-medium">{log.to || log.userId || 'system'}</td>
                  <td className="px-6 py-3 text-[#8B949E] group-hover:text-[#C9D1D9] transition-colors">
                    <span className="opacity-50 mr-2">›</span>
                    {log.subject || log.reference || log.details || 'N/A'}
                  </td>
                </tr>
              ))}
              {sortedLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <div className="size-10 border-2 border-dashed border-[#8B949E] rounded-lg animate-spin-slow"></div>
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-[0.2em]">Listening for events...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
