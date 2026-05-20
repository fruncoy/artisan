import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

export const marketplaceService = {
  getProducts: async (params) => {
    const { data } = await api.get('/marketplace/products', { params })
    return data.products
  },
}

export const artisanService = {
  getArtisans: async () => {
    const { data } = await api.get('/stores')
    return data.stores
  },
}

export const paymentService = {
  initializeTopup: async (amount, token) => {
    const { data } = await api.post('/payments/topup/initialize', { amount }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  verifyTopup: async (reference, token) => {
    const { data } = await api.post('/payments/topup/verify', { reference }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  getAdminBalances: async (token) => {
    const { data } = await api.get('/payments/admin/balances', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data.balances
  },
  recordPayout: async (payoutData, token) => {
    const { data } = await api.post('/payments/admin/payout', payoutData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  approveArtisan: async (uid, token) => {
    const { data } = await api.patch(`/admin/users/${uid}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  }
}

export const orderService = {
  placeOrder: async (orderData, token) => {
    const { data } = await api.post('/orders', orderData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  updateStatus: async (orderId, status, token) => {
    const { data } = await api.patch(`/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  }
}

export default api
