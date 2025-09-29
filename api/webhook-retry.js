const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const RETRY_DIR = path.join(__dirname, '../data');
const RETRY_FILE = path.join(RETRY_DIR, 'failed-webhooks.json');
const MAX_RETRIES = 3;

const loadFailedWebhooks = async () => {
  try {
    const data = await fs.readFile(RETRY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveFailedWebhooks = async (webhooks) => {
  try {
    await fs.writeFile(RETRY_FILE, JSON.stringify(webhooks, null, 2));
  } catch (error) {
    console.error('Error saving failed webhooks:', error);
  }
};

const addFailedWebhook = async (eventData, error) => {
  const failedWebhooks = await loadFailedWebhooks();

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
  await saveFailedWebhooks(failedWebhooks);
  console.log(`Added failed webhook to retry queue: ${webhook.eventType}`);
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
  const failedWebhooks = await loadFailedWebhooks();
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

  await saveFailedWebhooks(updated);
};

const startWebhookRetryScheduler = () => {
  cron.schedule('*/5 * * * *', async () => {
    const failedWebhooks = await loadFailedWebhooks();
    if (failedWebhooks.length > 0) {
      console.log(`Checking ${failedWebhooks.length} failed webhooks for retry...`);
      await retryFailedWebhooks();
    }
  });

  console.log('Webhook retry scheduler started (every 5 minutes)');
};

const getRetryStats = async () => {
  const failedWebhooks = await loadFailedWebhooks();
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