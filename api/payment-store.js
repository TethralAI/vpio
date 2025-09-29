const dataStore = require('./redis');

class PaymentStore {
  constructor() {
    this.PAYMENT_PREFIX = 'payment:';
    this.PAYMENT_INTENT_PREFIX = 'payment_intent:';
    this.RECENT_PAYMENTS_KEY = 'recent_payments';
    this.PAYMENT_INTENT_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
  }

  // Save payment record as JSON
  async savePayment(paymentData) {
    try {
      const paymentId = paymentData.id || paymentData.payment_intent_id || Date.now().toString();
      const key = `${this.PAYMENT_PREFIX}${paymentId}`;

      // Enrich payment data with metadata
      const enrichedPayment = {
        ...paymentData,
        id: paymentId,
        timestamp: new Date().toISOString(),
        created_at: paymentData.created_at || Date.now(),
        status: paymentData.status || 'pending',
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        processor: paymentData.processor || 'auto',
        metadata: {
          ...paymentData.metadata,
          saved_at: new Date().toISOString(),
          source: 'vpio_api'
        }
      };

      // Save payment record (no expiry for payment records)
      await dataStore.set(key, enrichedPayment);

      // Add to recent payments list (keep last 100)
      await this.addToRecentPayments(paymentId, enrichedPayment);

      console.log(`💾 Payment saved: ${paymentId}`);
      return { success: true, paymentId };

    } catch (error) {
      console.log('❌ Error saving payment:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get payment by ID
  async getPayment(paymentId) {
    try {
      const key = `${this.PAYMENT_PREFIX}${paymentId}`;
      const payment = await dataStore.get(key);

      if (payment) {
        console.log(`📖 Payment retrieved: ${paymentId}`);
        return { success: true, payment };
      } else {
        console.log(`🔍 Payment not found: ${paymentId}`);
        return { success: false, error: 'Payment not found' };
      }

    } catch (error) {
      console.log('❌ Error getting payment:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get recent payments (last 100)
  async getRecentPayments(limit = 20) {
    try {
      const recentList = await dataStore.get(this.RECENT_PAYMENTS_KEY) || [];

      // Get the actual payment data for the most recent ones
      const recentPayments = [];
      const paymentsToFetch = recentList.slice(0, limit);

      for (const paymentInfo of paymentsToFetch) {
        const paymentResult = await this.getPayment(paymentInfo.id);
        if (paymentResult.success) {
          recentPayments.push(paymentResult.payment);
        }
      }

      console.log(`📋 Retrieved ${recentPayments.length} recent payments`);
      return { success: true, payments: recentPayments, total: recentList.length };

    } catch (error) {
      console.log('❌ Error getting recent payments:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Add payment to recent payments list
  async addToRecentPayments(paymentId, paymentData) {
    try {
      let recentList = await dataStore.get(this.RECENT_PAYMENTS_KEY) || [];

      // Add new payment to the beginning
      const paymentInfo = {
        id: paymentId,
        amount: paymentData.amount,
        status: paymentData.status,
        timestamp: paymentData.timestamp,
        processor: paymentData.processor
      };

      recentList.unshift(paymentInfo);

      // Keep only last 100 payments
      recentList = recentList.slice(0, 100);

      await dataStore.set(this.RECENT_PAYMENTS_KEY, recentList);
      return true;

    } catch (error) {
      console.log('❌ Error updating recent payments:', error.message);
      return false;
    }
  }

  // Cache payment intent for 24 hours
  async cachePaymentIntent(intentId, intentData) {
    try {
      const key = `${this.PAYMENT_INTENT_PREFIX}${intentId}`;

      const enrichedIntent = {
        ...intentData,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (this.PAYMENT_INTENT_EXPIRY * 1000)).toISOString()
      };

      await dataStore.set(key, enrichedIntent, this.PAYMENT_INTENT_EXPIRY);
      console.log(`💰 Payment intent cached: ${intentId} (expires in 24h)`);
      return { success: true, intentId };

    } catch (error) {
      console.log('❌ Error caching payment intent:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get cached payment intent
  async getCachedPaymentIntent(intentId) {
    try {
      const key = `${this.PAYMENT_INTENT_PREFIX}${intentId}`;
      const intent = await dataStore.get(key);

      if (intent) {
        console.log(`💰 Payment intent retrieved from cache: ${intentId}`);
        return { success: true, intent };
      } else {
        console.log(`🔍 Payment intent not in cache or expired: ${intentId}`);
        return { success: false, error: 'Payment intent not found or expired' };
      }

    } catch (error) {
      console.log('❌ Error getting cached payment intent:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get payment statistics
  async getPaymentStats() {
    try {
      const recent = await this.getRecentPayments(100);

      if (!recent.success) {
        return { success: false, error: recent.error };
      }

      const payments = recent.payments;
      const stats = {
        total_payments: payments.length,
        successful_payments: payments.filter(p => p.status === 'succeeded').length,
        failed_payments: payments.filter(p => p.status === 'failed').length,
        pending_payments: payments.filter(p => p.status === 'pending').length,
        total_amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        processors: {},
        last_24h: 0,
        last_7d: 0
      };

      // Calculate processor distribution
      payments.forEach(payment => {
        const processor = payment.processor || 'unknown';
        stats.processors[processor] = (stats.processors[processor] || 0) + 1;
      });

      // Calculate recent activity
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const week = 7 * day;

      payments.forEach(payment => {
        const created = payment.created_at || 0;
        if (now - created < day) stats.last_24h++;
        if (now - created < week) stats.last_7d++;
      });

      return { success: true, stats };

    } catch (error) {
      console.log('❌ Error getting payment stats:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Search payments by criteria
  async searchPayments(criteria = {}) {
    try {
      const { status, processor, amount_min, amount_max, limit = 50 } = criteria;

      // Get all payment keys
      const keys = await dataStore.getKeys(`${this.PAYMENT_PREFIX}*`);
      const matchingPayments = [];

      for (const key of keys) {
        if (matchingPayments.length >= limit) break;

        const payment = await dataStore.get(key);
        if (!payment) continue;

        // Apply filters
        if (status && payment.status !== status) continue;
        if (processor && payment.processor !== processor) continue;
        if (amount_min && payment.amount < amount_min) continue;
        if (amount_max && payment.amount > amount_max) continue;

        matchingPayments.push(payment);
      }

      // Sort by timestamp (newest first)
      matchingPayments.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log(`🔍 Found ${matchingPayments.length} payments matching criteria`);
      return { success: true, payments: matchingPayments };

    } catch (error) {
      console.log('❌ Error searching payments:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get store status and health
  async getStoreStatus() {
    try {
      const dataStoreStatus = dataStore.getStatus();
      const recent = await this.getRecentPayments(1);

      return {
        ...dataStoreStatus,
        payments_stored: recent.total || 0,
        last_payment: recent.payments?.[0]?.timestamp || null,
        store_healthy: recent.success
      };

    } catch (error) {
      console.log('❌ Error getting store status:', error.message);
      return {
        redis_connected: false,
        fallback_mode: true,
        error: error.message,
        store_healthy: false
      };
    }
  }
}

module.exports = new PaymentStore();