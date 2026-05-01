import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getMyProducts,
  getProducts,
  updateProduct,
} from '../controllers/marketplaceController.js'
import { requireRole, verifyAuth } from '../middleware/auth.js'

export const marketplaceRouter = Router()

marketplaceRouter.get('/products', getProducts)
marketplaceRouter.post('/products', verifyAuth, requireRole('artisan'), createProduct)
marketplaceRouter.get('/products/me', verifyAuth, requireRole('artisan'), getMyProducts)
marketplaceRouter.patch('/products/:productId', verifyAuth, updateProduct)
marketplaceRouter.delete('/products/:productId', verifyAuth, deleteProduct)
