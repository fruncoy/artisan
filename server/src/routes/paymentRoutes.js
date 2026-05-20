import { Router } from 'express';
import { initializeTopup, paystackWebhook, getArtisanBalances, recordManualPayout, verifyTopup } from '../controllers/paymentController.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';

export const paymentRouter = Router();

// Public webhook (no auth)
paymentRouter.post('/webhook', paystackWebhook);

// Protected routes
paymentRouter.post('/topup/initialize', verifyAuth, initializeTopup);
paymentRouter.post('/topup/verify', verifyAuth, verifyTopup);

// Admin only routes
paymentRouter.get('/admin/balances', verifyAuth, requireRole('admin'), getArtisanBalances);
paymentRouter.post('/admin/payout', verifyAuth, requireRole('admin'), recordManualPayout);
