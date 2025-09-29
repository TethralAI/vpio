const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const checkStripeConnection = async () => {
  try {
    await stripe.accounts.retrieve();
    return { status: 'connected', message: 'Stripe API connection successful' };
  } catch (error) {
    return { status: 'failed', message: error.message };
  }
};

const getHealthStatus = async () => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  const stripeCheck = await checkStripeConnection();

  const health = {
    status: stripeCheck.status === 'connected' ? 'healthy' : 'degraded',
    timestamp,
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    services: {
      stripe: stripeCheck,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    }
  };

  return health;
};

module.exports = { getHealthStatus };