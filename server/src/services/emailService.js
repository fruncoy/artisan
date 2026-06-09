import * as Brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';
import { db } from '../firebase/admin.js';

dotenv.config();

const client = new Brevo.BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

const sender = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME || 'Artisan Marketplace'
};

export const emailService = {
  sendEmail: async (to, subject, htmlContent, metadata = {}) => {
    try {
      await client.transactionalEmails.sendTransacEmail({
        subject,
        htmlContent,
        sender,
        to: [{ email: to }]
      });
      console.log(`Email sent to ${to}: ${subject}`);

      // Log the email event to Firestore
      await db.collection('logs').add({
        type: 'email',
        to,
        subject,
        metadata,
        status: 'sent',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email Error:', error.message || error);
      
      // Log the failure
      await db.collection('logs').add({
        type: 'email_error',
        to,
        subject,
        error: error.message || String(error),
        status: 'failed',
        createdAt: new Date().toISOString()
      });
    }
  },

  sendOrderStatusUpdate: async (order, customer, status) => {
    const statusMessages = {
      processing: 'is now being processed',
      shipped: 'has been shipped',
      delivered: 'has been delivered',
      fulfilled: 'has been delivered',
      cancelled: 'has been cancelled'
    };
    
    const itemsList = order.items?.map(i => `<li>${i.name} (x${i.quantity})</li>`).join('') || '<li>Items in your order</li>';
    const subject = `Order #${order.id.slice(0, 8)} Update: ${status.toUpperCase()}`;
    const htmlContent = `
      <div style="font-family: sans-serif; color: #1C2434; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; rounded: 12px;">
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">Order Status Update</h1>
        <p>Hi ${customer.displayName || 'Customer'},</p>
        <p>Your order <strong>#${order.id.slice(0, 8)}</strong> ${statusMessages[status] || 'has been updated to ' + status}.</p>
        
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; margin-bottom: 12px;">Order Details</h2>
          <ul style="margin: 0; padding-left: 20px; font-weight: 500;">
            ${itemsList}
          </ul>
          <p style="margin-top: 16px; font-weight: 900; color: #003580;">Total: KES ${order.total?.toLocaleString() || '0'}</p>
        </div>

        <p>Log in to your account to see more details.</p>
        <a href="${process.env.FRONTEND_URL}/customer/orders" style="display: inline-block; background-color: #003580; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">View Order History</a>
      </div>
    `;
    await emailService.sendEmail(customer.email, subject, htmlContent);
  },

  sendWelcomeEmail: async (user) => {
    const subject = `Welcome to Artisan Marketplace, ${user.displayName || 'Artisan'}!`;
    const htmlContent = `
      <h1>Welcome to the Community!</h1>
      <p>Hello ${user.displayName || 'there'},</p>
      <p>We're thrilled to have you join our marketplace. You can now explore unique handcrafted products from talented artisans.</p>
      <a href="${process.env.FRONTEND_URL}">Start Exploring</a>
    `;
    await emailService.sendEmail(user.email, subject, htmlContent);
  },

  sendArtisanApplicationReceived: async (user) => {
    const subject = `Application Received - Artisan Marketplace`;
    const htmlContent = `
      <h1>Application Under Review</h1>
      <p>Hi ${user.displayName || 'Artisan'},</p>
      <p>We have received your artisan application and screening answers.</p>
      <p>Our team is currently reviewing your profile to ensure the best quality for our marketplace. You will receive an email once your account has been approved.</p>
      <p>Thank you for your patience!</p>
    `;
    await emailService.sendEmail(user.email, subject, htmlContent);
  },

  sendOrderConfirmation: async (order, customer) => {
    const itemsList = order.items?.map(i => `<li>${i.name} (x${i.quantity})</li>`).join('') || '<li>Items in your order</li>';
    const subject = `Order Confirmation #${order.id.slice(0, 8)}`;
    const htmlContent = `
      <div style="font-family: sans-serif; color: #1C2434; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">Thank you for your order!</h1>
        <p>Hi ${customer.displayName || 'Customer'},</p>
        <p>Your order <strong>#${order.id.slice(0, 8)}</strong> has been placed successfully.</p>
        
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; margin-bottom: 12px;">Order Summary</h2>
          <ul style="margin: 0; padding-left: 20px; font-weight: 500;">
            ${itemsList}
          </ul>
          <p style="margin-top: 16px; font-weight: 900; color: #003580;">Total: KES ${order.total.toLocaleString()}</p>
        </div>

        <p>We'll notify you when your items are being processed.</p>
        <a href="${process.env.FRONTEND_URL}/customer/orders" style="display: inline-block; background-color: #003580; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">Track Order</a>
      </div>
    `;
    await emailService.sendEmail(customer.email, subject, htmlContent);
  },

  sendArtisanOrderNotification: async (order, artisan) => {
    const myItems = order.items?.filter(i => i.artisanId === artisan.uid || i.artisanId === artisan.id) || [];
    const itemsList = myItems.map(i => `<li>${i.name} (x${i.quantity})</li>`).join('') || '<li>Items for your store</li>';
    
    const grossEarnings = myItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const commission = grossEarnings * 0.05;
    const netEarnings = grossEarnings - commission;

    const subject = `New Order Received! #${order.id.slice(0, 8)}`;
    const htmlContent = `
      <div style="font-family: sans-serif; color: #1C2434; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px; color: #10B981;">You have a new order!</h1>
        <p>Hi ${artisan.displayName || 'Artisan'},</p>
        <p>A new order has been placed for your products.</p>
        
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; margin-bottom: 12px;">Items to Prepare</h2>
          <ul style="margin: 0; padding-left: 20px; font-weight: 500;">
            ${itemsList}
          </ul>
          <div style="margin-top: 20px; border-top: 1px solid #E2E8F0; padding-top: 12px;">
            <p style="margin: 4px 0;">Gross Earnings: <strong>KES ${grossEarnings.toLocaleString()}</strong></p>
            <p style="margin: 4px 0; color: #EF4444;">Commission (5%): <strong>- KES ${commission.toLocaleString()}</strong></p>
            <p style="margin: 8px 0; font-size: 18px;">Net Payout: <strong>KES ${netEarnings.toLocaleString()}</strong></p>
          </div>
          <p style="margin-top: 16px; font-size: 12px; color: #64748B;">Order ID: #${order.id.slice(0, 8)}</p>
        </div>

        <p>Please log in to your dashboard to manage and ship this order.</p>
        <a href="${process.env.FRONTEND_URL}/artisan/orders" style="display: inline-block; background-color: #003580; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">Open Artisan Dashboard</a>
      </div>
    `;
    await emailService.sendEmail(artisan.email, subject, htmlContent);
  },

  sendTopupSuccess: async (user, amount) => {
    const subject = `Wallet Top-up Successful`;
    const htmlContent = `
      <h1>Wallet Updated!</h1>
      <p>Hi ${user.displayName || 'User'},</p>
      <p>Your wallet has been topped up with <strong>KES ${amount.toLocaleString()}</strong>.</p>
      <p>Current Balance: KES ${user.walletBalance.toLocaleString()}</p>
    `;
    await emailService.sendEmail(user.email, subject, htmlContent);
  },

  sendArtisanApprovalNotification: async (user) => {
    const subject = `Account Approved - Welcome Artisan!`;
    const htmlContent = `
      <h1>Congratulations!</h1>
      <p>Hi ${user.displayName || 'Artisan'},</p>
      <p>Your artisan application has been approved. You can now start listing your products and selling on our platform.</p>
      <a href="${process.env.FRONTEND_URL}/artisan">Go to Dashboard</a>
    `;
    await emailService.sendEmail(user.email, subject, htmlContent);
  },

  sendPayoutNotification: async (user, amount, note) => {
    const subject = `Payout Processed`;
    const htmlContent = `
      <h1>Payment Sent!</h1>
      <p>Hi ${user.displayName || 'Artisan'},</p>
      <p>We have processed a payout of <strong>KES ${amount.toLocaleString()}</strong> from your wallet.</p>
      ${note ? `<p>Note: ${note}</p>` : ''}
      <p>The funds should reflect in your account soon.</p>
    `;
    await emailService.sendEmail(user.email, subject, htmlContent);
  }
};
