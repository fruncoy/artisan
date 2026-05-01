import { Router } from 'express'
import {
  getAllOrders,
  getArtisanOrders,
  getMyOrders,
  placeOrder,
  updateOrderStatus,
  topUpWallet,
} from '../controllers/orderController.js'
import { requireRole, verifyAuth } from '../middleware/auth.js'

export const orderRouter = Router()

orderRouter.get('/my', verifyAuth, getMyOrders)
orderRouter.post('/', verifyAuth, placeOrder)
orderRouter.post('/topup', verifyAuth, topUpWallet)
orderRouter.get('/artisan', verifyAuth, requireRole('artisan'), getArtisanOrders)
orderRouter.get('/admin', verifyAuth, requireRole('admin'), getAllOrders)
orderRouter.patch('/:orderId/status', verifyAuth, updateOrderStatus)
