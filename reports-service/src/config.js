const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3005,

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-no-usar-en-produccion',
  },

  db: {
    path: process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'reports.db'),
  },

  storage: {
    reportsDir: process.env.REPORTS_STORAGE_PATH || path.resolve(__dirname, '..', 'data', 'reports'),
  },

  services: {
    budgetsUrl: process.env.BUDGETS_SERVICE_URL || 'http://localhost:3003',
    transactionsUrl: process.env.TRANSACTIONS_SERVICE_URL || 'http://localhost:3002',
  },
};

module.exports = config;
