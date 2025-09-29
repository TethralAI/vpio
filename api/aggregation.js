const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const DATA_DIR = path.join(__dirname, '../data');
const LOGS_DIR = path.join(__dirname, '../logs');

const ensureDirectories = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

const readPaymentLogs = async () => {
  try {
    const logFile = path.join(LOGS_DIR, 'payments.log');
    const data = await fs.readFile(logFile, 'utf8');
    return data.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) {
    console.log('No payment logs found or error reading logs');
    return [];
  }
};

const aggregateDailyStats = async () => {
  try {
    const logs = await readPaymentLogs();
    const today = new Date().toISOString().split('T')[0];

    const todayLogs = logs.filter(log =>
      log.timestamp && log.timestamp.startsWith(today)
    );

    const stats = {
      date: today,
      totalTransactions: todayLogs.length,
      successfulPayments: todayLogs.filter(log => log.status === 'succeeded').length,
      failedPayments: todayLogs.filter(log => log.status === 'failed').length,
      totalAmount: todayLogs.reduce((sum, log) => sum + (log.amount || 0), 0),
      totalFees: todayLogs.reduce((sum, log) => sum + (log.fee || 0), 0),
      generatedAt: new Date().toISOString()
    };

    const statsFile = path.join(DATA_DIR, 'payments_log.json');
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));

    console.log(`Daily stats aggregated: ${stats.totalTransactions} transactions, $${stats.totalAmount.toFixed(2)} total`);
    return stats;
  } catch (error) {
    console.error('Error aggregating daily stats:', error);
  }
};

const getLatestStats = async () => {
  try {
    const statsFile = path.join(DATA_DIR, 'payments_log.json');
    const data = await fs.readFile(statsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

const startDailyAggregation = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily aggregation...');
    await aggregateDailyStats();
  });

  console.log('Daily aggregation scheduled for midnight');
};

module.exports = {
  ensureDirectories,
  aggregateDailyStats,
  getLatestStats,
  startDailyAggregation
};