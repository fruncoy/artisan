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
      console.log(`Sending welcome email to: ${email} (Role: ${userData.role})`);
      if (userData.role === 'artisan') {
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
