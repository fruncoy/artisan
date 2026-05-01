import { Router } from 'express'
import {
  applyForArtisan,
  listArtisanApplications,
  reviewArtisanApplication,
} from '../controllers/artisanController.js'
import { requireRole, verifyAuth } from '../middleware/auth.js'

export const artisanRouter = Router()

artisanRouter.post('/apply', verifyAuth, requireRole('artisan'), applyForArtisan)
artisanRouter.get('/applications', verifyAuth, requireRole('admin'), listArtisanApplications)
artisanRouter.patch(
  '/applications/:uid/review',
  verifyAuth,
  requireRole('admin'),
  reviewArtisanApplication,
)
