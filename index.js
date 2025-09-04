require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config/constants');
const routes = require('./routes');
const dbConnection = require("./dbConnection/db.connection")

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
dbConnection()

// Routes
app.use('/', routes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global Error Handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(config.ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log('🚀 OneMoney Integration API Server started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.ENV}`);
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  console.log('💳 Payment API: POST http://localhost:' + PORT + '/api/payment');
  console.log('📋 Available endpoints:');
  console.log('   GET  /health                           - Health check');
  console.log('   POST /api/payment                      - Initiate payment');
  console.log('   POST /api/payment/callback             - Payment callback');
  console.log('   GET  /api/payment/status/:transOrderNo - Payment status');
  console.log('   POST /api/payment/test                 - Test integration');
});