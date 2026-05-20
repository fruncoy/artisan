import { db } from '../firebase/admin.js';
import { paystack } from '../services/paystackService.js';
import { emailService } from '../services/emailService.js';
import crypto from 'crypto';

export async function initializeTopup(req, res) {
  const { amount } = req.body;
  const user = req.user;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const data = await paystack.initializeTransaction(user.email, amount, {
      userId: user.uid,
      type: 'topup'
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function verifyTopup(req, res) {
  const { reference } = req.body;
  const userId = req.user.uid;

  try {
    // Log the verification attempt
    await db.collection('logs').add({
      type: 'payment_verification_attempt',
      userId,
      reference,
      createdAt: new Date().toISOString()
    });

    // 1. Verify with Paystack
    const response = await paystack.verifyTransaction(reference);
    
    if (response.status && response.data.status === 'success') {
      const { amount, metadata } = response.data;
      const actualAmount = amount / 100;

      // Ensure the transaction is for the correct user
      if (metadata.userId !== userId) {
        await db.collection('logs').add({
          type: 'payment_verification_mismatch',
          userId,
          reference,
          metadataUserId: metadata.userId,
          createdAt: new Date().toISOString()
        });
        return res.status(403).json({ message: 'Unauthorized transaction' });
      }

      // 2. Update wallet using a transaction to avoid double-crediting
      const existingTrans = await db.collection('transactions')
        .where('reference', '==', reference)
        .get();

      if (!existingTrans.empty) {
        return res.json({ message: 'Transaction already processed', status: 'success' });
      }

      await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await t.get(userRef);
        
        if (!userSnap.exists) throw new Error('User not found');
        
        const currentBalance = Number(userSnap.data().walletBalance) || 0;
        
        t.update(userRef, {
          walletBalance: currentBalance + actualAmount,
          updatedAt: new Date().toISOString()
        });

        const transRef = db.collection('transactions').doc();
        t.set(transRef, {
          userId,
          amount: actualAmount,
          type: 'topup',
          provider: 'paystack',
          reference,
          status: 'success',
          createdAt: new Date().toISOString()
        });
      });

      // Log success
      await db.collection('logs').add({
        type: 'payment_verification_success',
        userId,
        reference,
        amount: actualAmount,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'Wallet updated successfully', status: 'success' });
    } else {
      // Log failure from Paystack side
      await db.collection('logs').add({
        type: 'payment_verification_failed_paystack',
        userId,
        reference,
        paystackResponse: response.data,
        createdAt: new Date().toISOString()
      });
      res.status(400).json({ message: 'Transaction verification failed' });
    }
  } catch (error) {
    // Log exception
    await db.collection('logs').add({
      type: 'payment_verification_error',
      userId,
      reference,
      error: error.message,
      createdAt: new Date().toISOString()
    });
    res.status(500).json({ message: error.message });
  }
}

export async function paystackWebhook(req, res) {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { amount, metadata, reference } = event.data;
    const userId = metadata.userId;
    const actualAmount = amount / 100;

    try {
      await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await t.get(userRef);
        
        if (!userSnap.exists) throw new Error('User not found');
        
        const currentBalance = Number(userSnap.data().walletBalance) || 0;
        
        // Update balance
        t.update(userRef, {
          walletBalance: currentBalance + actualAmount,
          updatedAt: new Date().toISOString()
        });

        // Record transaction
        const transRef = db.collection('transactions').doc();
        t.set(transRef, {
          userId,
          amount: actualAmount,
          type: 'topup',
          provider: 'paystack',
          reference,
          status: 'success',
          createdAt: new Date().toISOString()
        });
      });
      
      // Send Email
      db.collection('users').doc(userId).get().then(snap => {
        if (snap.exists) {
          emailService.sendTopupSuccess(snap.data(), actualAmount);
        }
      });

      console.log(`Successfully topped up wallet for user ${userId} with ${actualAmount}`);
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }

  res.status(200).send('Webhook processed');
}

export async function getArtisanBalances(_req, res) {
  try {
    const artisans = await db.collection('users')
      .where('role', '==', 'artisan')
      .get();
    
    const balances = artisans.docs.map(doc => ({
      uid: doc.id,
      displayName: doc.data().displayName,
      email: doc.data().email,
      walletBalance: doc.data().walletBalance || 0
    }));

    res.json({ balances });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function recordManualPayout(req, res) {
  const { artisanId, amount, note } = req.body;

  if (!artisanId || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid payout details' });
  }

  try {
    await db.runTransaction(async (t) => {
      const artisanRef = db.collection('users').doc(artisanId);
      const artisanSnap = await t.get(artisanRef);

      if (!artisanSnap.exists) throw new Error('Artisan not found');

      const currentBalance = Number(artisanSnap.data().walletBalance) || 0;
      
      if (currentBalance < amount) {
        throw new Error('Insufficient balance for payout');
      }

      // Deduct from wallet
      t.update(artisanRef, {
        walletBalance: currentBalance - amount,
        updatedAt: new Date().toISOString()
      });

      // Record payout transaction
      const transRef = db.collection('transactions').doc();
      t.set(transRef, {
        userId: artisanId,
        amount: -amount,
        type: 'payout',
        note,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    });

    // Send Email
    db.collection('users').doc(artisanId).get().then(snap => {
      if (snap.exists) {
        emailService.sendPayoutNotification(snap.data(), amount, note);
      }
    });

    res.json({ message: 'Payout recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
