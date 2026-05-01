import { Router } from 'express'
import { getMyStore, getStoreById, upsertMyStore } from '../controllers/storeController.js'
import { requireRole, verifyAuth } from '../middleware/auth.js'

export const storeRouter = Router()

storeRouter.get('/me', verifyAuth, requireRole('artisan'), getMyStore)
storeRouter.put('/me', verifyAuth, requireRole('artisan'), upsertMyStore)
storeRouter.get('/:storeId', getStoreById)
