const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  development: {
    port: process.env.PORT || 3000,
    nodeEnv: 'development',
    enableLogging: true,
    corsOrigin: '*',
    oneMoneyEndpoint: process.env.ONEMONEY_ENDPOINT || 'http://172.28.255.24:8087/api/pay/payment/push',
    notifyUrl: process.env.NOTIFY_URL || 'http://10.44.16.51:8762/responsereceiver/TransactionResultService',
    merchantNumber: process.env.MERCHANT_NUMBER || '1883151315996622850',
    encryptKeyId: process.env.ENCRYPT_KEY_ID || '6c12e964cd59',
    secretKey: process.env.SECRET_KEY || 'mysampleaeskey16'
  },
  
  production: {
    port: process.env.PORT || 8080,
    nodeEnv: 'production',
    enableLogging: process.env.ENABLE_LOGGING === 'true',
    corsOrigin: process.env.CORS_ORIGIN || 'https://your-domain.com',
    oneMoneyEndpoint: process.env.ONEMONEY_ENDPOINT,
    notifyUrl: process.env.NOTIFY_URL,
    merchantNumber: process.env.MERCHANT_NUMBER,
    encryptKeyId: process.env.ENCRYPT_KEY_ID,
    secretKey: process.env.SECRET_KEY
  },

  test: {
    port: 3001,
    nodeEnv: 'test',
    enableLogging: false,
    corsOrigin: '*',
    oneMoneyEndpoint: 'http://test-endpoint.com/api/pay/payment/push',
    notifyUrl: 'http://test-callback.com/callback',
    merchantNumber: 'test-merchant-123',
    encryptKeyId: 'test-key-id',
    secretKey: 'testkey16chars!'
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = {
  ...config[environment],
  environment,
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isTest: environment === 'test'
};