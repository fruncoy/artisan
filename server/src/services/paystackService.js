import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export const paystack = {
  initializeTransaction: async (email, amount, metadata = {}) => {
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amount * 100, // Paystack expects amount in kobo/cents
          metadata,
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/wallet`
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Paystack Init Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize Paystack transaction');
    }
  },

  verifyTransaction: async (reference) => {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Paystack Verify Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify Paystack transaction');
    }
  }
};
