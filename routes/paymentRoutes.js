const express = require('express');
const PaymentService = require('../services/paymentService');
const PaymentRequest = require('../models/PaymentRequest');
const PaymentResponse = require('../models/PaymentResponse');
const config = require('../config/constants');

const router = express.Router();
const paymentService = new PaymentService();

// POST /api/payment - Initiate payment
router.post('/payment-c2b', async (req, res) => {
  try {
    console.log('🚀 Payment request received:', req.body);

    // Create and validate payment request
    const paymentRequest = PaymentRequest.fromRequestBody(req.body);
    const validation = paymentRequest.validate();

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment data',
        errors: validation.errors
      });
    }

    // Initiate payment
    const paymentData = paymentRequest.toJSON();
    const result = await paymentService.initiatePayment(paymentData);
    
    // Process response
    const processedResult = paymentService.processPaymentResponse(result.response);

    return res.json(processedResult);

  } catch (error) {
    console.error('❌ Payment API Error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Payment request failed',
      error: error.message
    });
  }
});

// POST /api/payment/callback - Handle OneMoney callback
router.post('/payment/callback', async (req, res) => {
  try {
    console.log('📥 Payment callback received:', req.body);

    // Process the callback data
    const callbackData = req.body;
    
    // If the callback contains encrypted data, decrypt it
    if (callbackData.encryptData && callbackData.encryptKey) {
      const decryptionResult = paymentService.cryptoService.decryptMessage(callbackData, config.HOWZIT_PRIVATE_KEY);
      
      if (decryptionResult && decryptionResult.originalPayload) {
        const paymentResponse = PaymentResponse.fromOneMoneyResponse(
          decryptionResult.originalPayload,
          decryptionResult.isValid
        );

        console.log('✅ Payment callback processed:', paymentResponse.toJSON());

        // Here you would typically update your database with the payment status
        // await updatePaymentStatus(paymentResponse);

        return res.json({
          success: true,
          message: 'Callback processed successfully',
          data: paymentResponse.toJSON()
        });
      }
    }

    // Handle unencrypted callback
    return res.json({
      success: true,
      message: 'Callback received',
      data: callbackData
    });

  } catch (error) {
    console.error('❌ Payment callback error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message
    });
  }
});

// GET /api/payment/status/:transOrderNo - Check payment status
router.get('/payment/status/:transOrderNo', async (req, res) => {
  try {
    const { transOrderNo } = req.params;
    
    console.log('🔍 Payment status check for:', transOrderNo);

    // Here you would typically query your database for the payment status
    // const paymentStatus = await getPaymentStatus(transOrderNo);

    // For now, return a placeholder response
    return res.json({
      success: true,
      message: 'Payment status retrieved',
      data: {
        transOrderNo: transOrderNo,
        status: 'pending',
        message: 'Payment status check not yet implemented'
      }
    });

  } catch (error) {
    console.error('❌ Payment status check error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Payment status check failed',
      error: error.message
    });
  }
});

// POST /api/payment/test - Test payment integration
router.post('/payment/test', async (req, res) => {
  try {
    console.log('🧪 Testing payment integration...');

    const result = await paymentService.testC2BPush();

    return res.json({
      success: true,
      message: 'Payment test completed',
      data: result
    });

  } catch (error) {
    console.error('❌ Payment test error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Payment test failed',
      error: error.message
    });
  }
});

module.exports = router;