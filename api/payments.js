const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logPayment, logError } = require('./logger');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required', message: 'Amount must be greater than 0' });
    }

    const amountWithFee = Math.round(amount * 1.005 * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountWithFee,
      currency,
      metadata: { ...metadata, originalAmount: amount, fee: '0.5%' },
      automatic_payment_methods: { enabled: true },
    });

    const paymentData = {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      originalAmount: amount,
      fee: amountWithFee / 100 - amount,
      currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    };

    await logPayment(paymentData);

    res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      originalAmount: amount,
      fee: amountWithFee / 100 - amount
    });
  } catch (error) {
    await logError(error, { endpoint: 'create-payment', amount, currency });
    res.status(500).json({ error: 'Payment creation failed', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000),
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Payment status retrieval failed:', error);
    res.status(404).json({ error: 'Payment not found', message: error.message });
  }
});

module.exports = router;