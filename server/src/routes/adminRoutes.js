import { Router } from 'express'
import { getAdminAnalytics, suspendUser, approveArtisan } from '../controllers/adminController.js'
import { requireRole, verifyAuth } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.get('/analytics', verifyAuth, requireRole('admin'), getAdminAnalytics)
adminRouter.patch('/users/:uid/suspend', verifyAuth, requireRole('admin'), suspendUser)
adminRouter.patch('/users/:uid/approve', verifyAuth, requireRole('admin'), approveArtisan)
