const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3002,

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-no-usar-en-produccion',
  },

  db: {
    path: process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'transactions.db'),
  },
};

module.exports = config;
