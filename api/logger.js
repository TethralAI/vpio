const fs = require('fs').promises;
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../logs');
const PAYMENT_LOG = path.join(LOGS_DIR, 'payments.log');
const ERROR_LOG = path.join(LOGS_DIR, 'errors.log');

const ensureLogDirectory = async () => {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating logs directory:', error);
  }
};

const appendLog = async (filePath, logEntry) => {
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(filePath, logLine);
  } catch (error) {
    console.error('Error writing to log:', error);
  }
};

const logPayment = async (paymentData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'payment',
    id: paymentData.id,
    amount: paymentData.amount,
    originalAmount: paymentData.originalAmount,
    fee: paymentData.fee,
    currency: paymentData.currency || 'usd',
    status: paymentData.status || 'created',
    metadata: paymentData.metadata
  };

  await appendLog(PAYMENT_LOG, logEntry);
  console.log(`Payment logged: ${logEntry.id} - $${logEntry.amount}`);
};

const logWebhook = async (webhookData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'webhook',
    eventType: webhookData.type,
    eventId: webhookData.id,
    paymentId: webhookData.data?.object?.id,
    status: webhookData.data?.object?.status
  };

  await appendLog(PAYMENT_LOG, logEntry);
  console.log(`Webhook logged: ${logEntry.eventType} - ${logEntry.paymentId}`);
};

const logError = async (error, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'error',
    message: error.message,
    stack: error.stack,
    context
  };

  await appendLog(ERROR_LOG, logEntry);
  console.error(`Error logged: ${error.message}`);
};

const getRecentLogs = async (type = 'payment', limit = 50) => {
  try {
    const logFile = type === 'error' ? ERROR_LOG : PAYMENT_LOG;
    const data = await fs.readFile(logFile, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());

    return lines
      .slice(-limit)
      .map(line => JSON.parse(line))
      .reverse();
  } catch (error) {
    return [];
  }
};

const getLogStats = async () => {
  try {
    const paymentLogs = await getRecentLogs('payment', 1000);
    const errorLogs = await getRecentLogs('error', 1000);

    const today = new Date().toISOString().split('T')[0];
    const todayPayments = paymentLogs.filter(log =>
      log.timestamp.startsWith(today)
    );

    return {
      totalPayments: paymentLogs.length,
      todayPayments: todayPayments.length,
      totalErrors: errorLogs.length,
      successfulPayments: paymentLogs.filter(log => log.status === 'succeeded').length,
      failedPayments: paymentLogs.filter(log => log.status === 'failed').length
    };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  ensureLogDirectory,
  logPayment,
  logWebhook,
  logError,
  getRecentLogs,
  getLogStats
};