const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-no-usar-en-produccion',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },

  db: {
    path: process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'auth.db'),
  },
};

module.exports = config;
