const express = require('express');
const paymentRoutes = require('./paymentRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'OneMoney Integration API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Payment routes
router.use('/api/v1', paymentRoutes);

// 404 handler for unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableEndpoints: [
      'GET /health - Health check',
      'POST /api/payment - Initiate payment',
      'POST /api/payment/callback - Payment callback',
      'GET /api/payment/status/:transOrderNo - Check payment status',
      'POST /api/payment/test - Test payment integration'
    ]
  });
});

module.exports = router;