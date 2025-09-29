const cron = require('node-cron');

const MAX_RETRIES = 3;
let failedWebhooks = []; // In-memory storage

const addFailedWebhook = async (eventData, error) => {
  const webhook = {
    id: Date.now().toString(),
    eventType: eventData.type,
    eventId: eventData.id,
    payload: eventData,
    error: error.message,
    retryCount: 0,
    firstAttempt: new Date().toISOString(),
    lastAttempt: new Date().toISOString(),
    nextRetry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
  };

  failedWebhooks.push(webhook);
  console.log(`Added failed webhook to retry queue: ${webhook.eventType} (${failedWebhooks.length} total)`);
};

const processWebhookEvent = async (eventData) => {
  try {
    switch (eventData.type) {
      case 'payment_intent.succeeded':
        console.log('Processing successful payment:', eventData.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('Processing failed payment:', eventData.data.object.id);
        break;
      default:
        console.log(`Processing webhook: ${eventData.type}`);
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const retryFailedWebhooks = async () => {
  const now = new Date();
  const updated = [];

  for (const webhook of failedWebhooks) {
    if (webhook.retryCount >= MAX_RETRIES) {
      console.log(`Webhook ${webhook.id} exceeded max retries, removing`);
      continue;
    }

    if (new Date(webhook.nextRetry) > now) {
      updated.push(webhook);
      continue;
    }

    try {
      await processWebhookEvent(webhook.payload);
      console.log(`Successfully retried webhook ${webhook.id}`);
    } catch (error) {
      webhook.retryCount++;
      webhook.lastAttempt = now.toISOString();
      webhook.error = error.message;

      const delayMinutes = Math.pow(2, webhook.retryCount) * 5;
      webhook.nextRetry = new Date(now.getTime() + delayMinutes * 60 * 1000).toISOString();

      updated.push(webhook);
      console.log(`Retry ${webhook.retryCount} failed for webhook ${webhook.id}, next retry in ${delayMinutes}m`);
    }
  }

  failedWebhooks = updated;
};

const startWebhookRetryScheduler = () => {
  cron.schedule('0 * * * *', async () => {
    if (failedWebhooks.length > 0) {
      console.log(`Checking ${failedWebhooks.length} failed webhooks for retry...`);
      await retryFailedWebhooks();
    }
  });

  console.log('Webhook retry scheduler started (hourly)');
};

const getRetryStats = async () => {
  return {
    total: failedWebhooks.length,
    byRetryCount: failedWebhooks.reduce((acc, webhook) => {
      acc[webhook.retryCount] = (acc[webhook.retryCount] || 0) + 1;
      return acc;
    }, {}),
    oldestFailure: failedWebhooks.length > 0
      ? Math.min(...failedWebhooks.map(w => new Date(w.firstAttempt).getTime()))
      : null
  };
};

module.exports = {
  addFailedWebhook,
  processWebhookEvent,
  startWebhookRetryScheduler,
  getRetryStats
};