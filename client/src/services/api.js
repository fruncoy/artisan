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

export default api
