const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logWebhook, logError } = require('./logger');
const { addFailedWebhook, processWebhookEvent } = require('./webhook-retry');

const router = express.Router();

router.use(express.raw({ type: 'application/json' }));

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    await logError(err, { endpoint: 'webhook', signature: !!sig });
    return res.status(400).json({ error: 'Invalid signature', message: err.message });
  }

  try {
    await logWebhook(event);
    await processWebhookEvent(event);
    res.json({ received: true, type: event.type });
  } catch (error) {
    await logError(error, { webhook: event.type, eventId: event.id });
    await addFailedWebhook(event, error);
    res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
});

module.exports = router;