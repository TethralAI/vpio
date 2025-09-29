const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logPayment, logWebhook, logError, ensureLogDirectory } = require('./logger');
const { ensureDirectories, startDailyAggregation, getLatestStats } = require('./aggregation');
const { addFailedWebhook, processWebhookEvent, startWebhookRetryScheduler, getRetryStats } = require('./webhook-retry-memory');
const { startHealthMetricsLogging } = require('./health-metrics');
const dataStore = require('./redis');
const paymentStore = require('./payment-store');

const app = express();
const PORT = process.env.PORT || 3000;

// API key validation now handled by Redis/dataStore with fallback

// Middleware
app.use(cors({ origin: '*' }));

// Webhook middleware (raw body for signature verification)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON middleware for other endpoints
app.use(express.json());

// API key authentication middleware with Redis/memory fallback
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide an API key in the x-api-key header'
    });
  }

  try {
    const isValid = await dataStore.isValidAPIKey(apiKey);
    if (!isValid) {
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }
    next();
  } catch (error) {
    console.log('❌ API key validation error:', error.message);
    return res.status(500).json({
      error: 'Authentication service unavailable',
      message: 'Please try again later'
    });
  }
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Stripe connection
    await stripe.accounts.retrieve();

    // Get Redis/dataStore status
    const storeStatus = await paymentStore.getStoreStatus();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
      services: {
        stripe: { status: 'connected', message: 'Stripe API connection successful' },
        redis: {
          status: storeStatus.redis_connected ? 'connected' : 'fallback',
          message: storeStatus.redis_connected ? 'Redis connected' : 'Using memory fallback',
          details: storeStatus
        }
      }
    });
  } catch (error) {
    const storeStatus = await paymentStore.getStoreStatus();
    res.status(500).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        stripe: { status: 'failed', message: error.message },
        redis: {
          status: storeStatus.redis_connected ? 'connected' : 'fallback',
          message: storeStatus.redis_connected ? 'Redis connected' : 'Using memory fallback'
        }
      }
    });
  }
});

// Create payment intent
app.post('/api/payments/create', authenticateApiKey, async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {}, processor = 'auto' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid amount is required',
        message: 'Amount must be greater than 0'
      });
    }

    const amountWithFee = Math.round(amount * 1.005 * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountWithFee,
      currency,
      metadata: { ...metadata, originalAmount: amount, fee: '0.5%', processor },
      automatic_payment_methods: { enabled: true },
    });

    const paymentData = {
      id: paymentIntent.id,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      originalAmount: amount,
      fee: amountWithFee / 100 - amount,
      currency,
      status: paymentIntent.status,
      processor,
      created_at: paymentIntent.created * 1000,
      metadata: paymentIntent.metadata
    };

    // Save payment to Redis/memory store
    await paymentStore.savePayment(paymentData);

    // Cache payment intent for 24 hours
    await paymentStore.cachePaymentIntent(paymentIntent.id, {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created
    });

    // Legacy logging (keep for compatibility)
    await logPayment(paymentData);

    res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      originalAmount: amount,
      fee: amountWithFee / 100 - amount,
      processor,
      cached: true
    });
  } catch (error) {
    res.status(500).json({
      error: 'Payment creation failed',
      message: error.message
    });
  }
});

// Get payment status (check cache first, then Stripe)
app.get('/api/payments/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    // First try to get from our payment store
    const storedPayment = await paymentStore.getPayment(id);
    if (storedPayment.success) {
      return res.json({
        id: storedPayment.payment.id,
        status: storedPayment.payment.status,
        amount: storedPayment.payment.amount,
        currency: storedPayment.payment.currency,
        created: new Date(storedPayment.payment.created_at || Date.now()),
        processor: storedPayment.payment.processor,
        metadata: storedPayment.payment.metadata,
        source: 'cache'
      });
    }

    // Fallback to Stripe API
    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    const responseData = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000),
      metadata: paymentIntent.metadata,
      source: 'stripe'
    };

    // Cache the result for future requests
    await paymentStore.savePayment({
      ...responseData,
      payment_intent_id: paymentIntent.id,
      created_at: paymentIntent.created * 1000,
      processor: paymentIntent.metadata?.processor || 'stripe'
    });

    res.json(responseData);
  } catch (error) {
    res.status(404).json({
      error: 'Payment not found',
      message: error.message
    });
  }
});

// Stripe webhook handler
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).json({
      error: 'Invalid signature',
      message: err.message
    });
  }

  try {
    await logWebhook(event);
    await processWebhookEvent(event);
    res.json({ received: true, type: event.type });
  } catch (error) {
    await logError(error, { webhook: event.type, eventId: event.id });
    await addFailedWebhook(event, error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// Stats endpoint (enhanced with Redis data)
app.get('/api/stats', authenticateApiKey, async (req, res) => {
  try {
    const [dailyStats, retryStats, paymentStats, storeStatus] = await Promise.all([
      getLatestStats(),
      getRetryStats(),
      paymentStore.getPaymentStats(),
      paymentStore.getStoreStatus()
    ]);

    res.json({
      today: dailyStats || {
        date: new Date().toISOString().split('T')[0],
        totalTransactions: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
        totalFees: 0,
        generatedAt: new Date().toISOString()
      },
      webhookRetries: retryStats,
      payments: paymentStats.success ? paymentStats.stats : null,
      storage: storeStatus
    });
  } catch (error) {
    await logError(error, { endpoint: 'stats' });
    res.status(500).json({
      error: 'Stats retrieval failed',
      message: error.message
    });
  }
});

// Get recent payments
app.get('/api/payments', authenticateApiKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await paymentStore.getRecentPayments(limit);

    if (result.success) {
      res.json({
        payments: result.payments,
        total: result.total,
        limit,
        source: 'redis_cache'
      });
    } else {
      res.status(500).json({
        error: 'Failed to retrieve payments',
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Payment retrieval failed',
      message: error.message
    });
  }
});

// Search payments
app.get('/api/payments/search', authenticateApiKey, async (req, res) => {
  try {
    const criteria = {
      status: req.query.status,
      processor: req.query.processor,
      amount_min: req.query.amount_min ? parseFloat(req.query.amount_min) : undefined,
      amount_max: req.query.amount_max ? parseFloat(req.query.amount_max) : undefined,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await paymentStore.searchPayments(criteria);

    if (result.success) {
      res.json({
        payments: result.payments,
        criteria,
        count: result.payments.length
      });
    } else {
      res.status(500).json({
        error: 'Search failed',
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Payment search failed',
      message: error.message
    });
  }
});

// API Key management endpoints
app.get('/api/admin/keys', authenticateApiKey, async (req, res) => {
  try {
    const keys = await dataStore.getAllAPIKeys();
    res.json({
      api_keys: keys,
      count: keys.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve API keys',
      message: error.message
    });
  }
});

app.post('/api/admin/keys', authenticateApiKey, async (req, res) => {
  try {
    const { api_key } = req.body;
    if (!api_key) {
      return res.status(400).json({
        error: 'API key required',
        message: 'Please provide an api_key in the request body'
      });
    }

    const success = await dataStore.addAPIKey(api_key);
    if (success) {
      res.json({
        success: true,
        message: `API key '${api_key}' added successfully`
      });
    } else {
      res.status(500).json({
        error: 'Failed to add API key',
        message: 'Could not add API key to store'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add API key',
      message: error.message
    });
  }
});

app.delete('/api/admin/keys/:key', authenticateApiKey, async (req, res) => {
  try {
    const { key } = req.params;
    const success = await dataStore.removeAPIKey(key);

    if (success) {
      res.json({
        success: true,
        message: `API key '${key}' removed successfully`
      });
    } else {
      res.status(500).json({
        error: 'Failed to remove API key',
        message: 'Could not remove API key from store'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to remove API key',
      message: error.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint was not found'
  });
});

// Initialize maintenance services
const initializeServices = async () => {
  try {
    await ensureLogDirectory();
    await ensureDirectories();
    startDailyAggregation();
    startWebhookRetryScheduler();
    startHealthMetricsLogging();
    console.log('All maintenance services initialized');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 VPIO API running on port ${PORT}`);
  console.log('📡 Redis integration enabled with memory fallback');
  await initializeServices();
});

module.exports = app;