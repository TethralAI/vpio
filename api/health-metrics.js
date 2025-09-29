const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const LOGS_DIR = path.join(__dirname, '../logs');
const HEALTH_LOG = path.join(LOGS_DIR, 'health-metrics.log');

const logHealthMetrics = async () => {
  try {
    const memUsage = process.memoryUsage();
    const healthData = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024) // MB
      },
      cpu: process.cpuUsage(),
      pid: process.pid
    };

    const logLine = JSON.stringify(healthData) + '\n';
    await fs.appendFile(HEALTH_LOG, logLine);

    console.log(`Health metrics logged: ${healthData.memory.heapUsed}MB heap, ${Math.floor(healthData.uptime / 60)}m uptime`);
  } catch (error) {
    console.error('Error logging health metrics:', error);
  }
};

const startHealthMetricsLogging = () => {
  // Log every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await logHealthMetrics();
  });

  console.log('Health metrics logging started (every 5 minutes)');
};

const getRecentHealthMetrics = async (limit = 24) => {
  try {
    const data = await fs.readFile(HEALTH_LOG, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());

    return lines
      .slice(-limit)
      .map(line => JSON.parse(line))
      .reverse();
  } catch (error) {
    return [];
  }
};

module.exports = {
  logHealthMetrics,
  startHealthMetricsLogging,
  getRecentHealthMetrics
};