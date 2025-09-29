const express = require('express');
const cors = require('cors');
const { authenticateApiKey } = require('./auth');
const payments = require('./payments');
const webhooks = require('./webhooks');
const { getHealthStatus } = require('./health');
const { ensureLogDirectory, getLogStats, logError } = require('./logger');
const { ensureDirectories, startDailyAggregation, getLatestStats } = require('./aggregation');
const { startWebhookRetryScheduler, getRetryStats } = require('./webhook-retry');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use('/api/webhooks', webhooks);
app.use(express.json());
app.use('/api', authenticateApiKey);
app.use('/api/payments', payments);

app.get('/health', async (req, res) => {
  try {
    const health = await getHealthStatus();
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [logStats, dailyStats, retryStats] = await Promise.all([
      getLogStats(),
      getLatestStats(),
      getRetryStats()
    ]);

    res.json({
      logs: logStats,
      daily: dailyStats,
      webhookRetries: retryStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Stats retrieval failed', message: error.message });
  }
});

app.use(async (err, req, res, next) => {
  await logError(err, { url: req.url, method: req.method });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const initializeServices = async () => {
  try {
    await ensureLogDirectory();
    await ensureDirectories();
    startDailyAggregation();
    startWebhookRetryScheduler();
    console.log('All maintenance services initialized');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
};

app.listen(PORT, async () => {
  console.log(`VibePay API running on port ${PORT}`);
  await initializeServices();
});