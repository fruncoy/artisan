import { Router } from 'express';
import { db } from '../firebase/admin.js';
import { emailService } from '../services/emailService.js';
import { verifyAuth } from '../middleware/auth.js';

export const userRouter = Router();

userRouter.post('/sync', verifyAuth, async (req, res) => {
  const { uid, email, displayName } = req.user;
  
  try {
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    
    if (!snap.exists) {
      // This shouldn't happen if they are authenticated, but good to handle
      return res.status(404).json({ message: 'User profile not found' });
    }

    const userData = snap.data();
    
    // Check if welcome email already sent
    if (!userData.welcomeEmailSent) {
      if (userData.role === 'artisan') {
        // For artisans, we send a "application received" email if they just signed up or filled screening
        // But if they are already approved, maybe we send the welcome?
        // Let's stick to the logic: artisans get "application received" first.
        if (userData.artisanStatus === 'pending') {
          await emailService.sendArtisanApplicationReceived({ email, displayName });
        }
      } else {
        await emailService.sendWelcomeEmail({ email, displayName });
      }
      await userRef.update({ welcomeEmailSent: true });
    }

    res.json({ message: 'User synced', profile: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
