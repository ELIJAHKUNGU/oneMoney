const express = require('express');
const PaymentService = require('../services/paymentService');
const PaymentRequest = require('../models/PaymentRequest');
const PaymentResponse = require('../models/PaymentResponse');
const OneTransaction = require('../models/OneTransaction');
const CallbackLog = require('../models/CallbackLog');
const loggingService = require('../services/loggingService');
const config = require('../config/constants');

const router = express.Router();
const paymentService = new PaymentService();

// POST /api/payment - Initiate payment
router.post('/payment-c2b', async (req, res) => {
  const requestId = require('crypto').randomUUID();
  
  try {
    console.log('🚀 Payment request received:', req.body);

    // Set logging context for this request
    loggingService.setRequestId(requestId).setContext({
      httpMethod: req.method,
      httpUrl: req.originalUrl,
      clientIp: req.ip,
      userAgent: req.headers['user-agent']
    });

    await loggingService.info('Payment request received', {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment-c2b',
      details: {
        requestBody: req.body,
        requestId
      }
    });

    // Create and validate payment request
    const paymentRequest = PaymentRequest.fromRequestBody(req.body);
    const validation = paymentRequest.validate();

    if (!validation.isValid) {
      await loggingService.warn('Payment validation failed', {
        category: 'validation',
        module: 'paymentRoutes',
        function: 'payment-c2b',
        details: {
          errors: validation.errors,
          requestBody: req.body
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid payment data',
        errors: validation.errors
      });
    }

    // Prepare client info for PaymentService
    const clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    // Initiate payment
    const paymentData = paymentRequest.toJSON();
    const result = await paymentService.initiatePayment(paymentData, clientInfo);
    
    // Process response
    const processedResult = await paymentService.processPaymentResponse(result.response, result.transaction);

    await loggingService.info('Payment request completed successfully', {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment-c2b',
      transOrderNo: result.transaction?.transOrderNo,
      details: {
        success: processedResult.success,
        transOrderNo: result.transaction?.transOrderNo
      }
    });

    return res.json(processedResult);

  } catch (error) {
    console.error('❌ Payment API Error:', error.message);
    
    await loggingService.error('Payment request failed', error, {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment-c2b',
      details: {
        requestBody: req.body,
        requestId
      }
    });
    
    return res.status(500).json({
      success: false,
      message: 'Payment request failed',
      error: error.message,
      requestId
    });
  } finally {
    // Clear logging context
    loggingService.clearContext();
  }
});

// POST /api/payment/callback - Handle OneMoney callback
router.post('/payment/callback', async (req, res) => {
  let callbackLog = null;
  const requestId = require('crypto').randomUUID();
  
  try {
    console.log('📥 Payment callback received:', req.body);

    // Set logging context
    loggingService.setRequestId(requestId).setContext({
      httpMethod: req.method,
      httpUrl: req.originalUrl,
      clientIp: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Extract transOrderNo from callback (try different possible locations)
    let transOrderNo = req.body.transOrderNo || 
                      req.body.orderNo || 
                      (req.body.data && typeof req.body.data === 'string' ? 
                       JSON.parse(req.body.data).transOrderNo : null);

    // Create callback log entry
    callbackLog = await loggingService.createCallbackLog(req, transOrderNo);
    
    // Process the callback data
    const callbackData = req.body;
    let processedData = null;
    let isEncrypted = false;
    let decryptionSuccess = false;
    let signatureValid = false;
    
    // If the callback contains encrypted data, decrypt it
    if (callbackData.encryptData && callbackData.encryptKey) {
      isEncrypted = true;
      callbackLog.isEncrypted = true;
      
      try {
        await loggingService.logEncryptionEvent('callback_decryption_start', true);
        
        const decryptionResult = paymentService.cryptoService.decryptMessage(callbackData, config.HOWZIT_PRIVATE_KEY);
        
        if (decryptionResult && decryptionResult.originalPayload) {
          processedData = decryptionResult.originalPayload;
          decryptionSuccess = true;
          signatureValid = decryptionResult.isValid;
          transOrderNo = processedData.transOrderNo || transOrderNo;
          
          // Update callback log with decryption details
          callbackLog.encryptionDetails = {
            encryptKeyId: callbackData.encryptKeyId,
            signaturePresent: !!callbackData.signData,
            signatureValid: signatureValid,
            decryptionSuccess: true
          };
          
          callbackLog.processedData = processedData;
          callbackLog.transOrderNo = transOrderNo;
          
          await loggingService.logEncryptionEvent('callback_decryption_success', true, {
            transOrderNo,
            signatureValid
          });

          // Process callback using PaymentService
          const result = await paymentService.processCallback(processedData, transOrderNo);
          
          if (result.success) {
            callbackLog.transactionFound = true;
            callbackLog.transactionId = result.transaction?._id;
            await callbackLog.markAsProcessed(result, 'Callback processed successfully');
          } else {
            await callbackLog.markAsFailed(new Error(result.message), 'Transaction not found');
          }

          const paymentResponse = PaymentResponse.fromOneMoneyResponse(
            processedData,
            signatureValid
          );

          console.log('✅ Payment callback processed:', paymentResponse.toJSON());

          const responseData = {
            success: true,
            message: 'Callback processed successfully',
            data: paymentResponse.toJSON()
          };

          await callbackLog.setResponse(200, responseData);
          
          return res.json(responseData);
        } else {
          throw new Error('Failed to decrypt callback payload');
        }
      } catch (decryptError) {
        callbackLog.encryptionDetails = {
          encryptKeyId: callbackData.encryptKeyId,
          signaturePresent: !!callbackData.signData,
          signatureValid: false,
          decryptionSuccess: false,
          decryptionError: decryptError.message
        };
        
        await loggingService.logEncryptionEvent('callback_decryption_failed', false, {
          error: decryptError.message,
          transOrderNo
        });
        
        throw decryptError;
      }
    } else {
      // Handle unencrypted callback
      processedData = callbackData;
      transOrderNo = transOrderNo || 'unknown';
      
      callbackLog.transOrderNo = transOrderNo;
      callbackLog.processedData = processedData;
      
      await loggingService.info('Unencrypted callback received', {
        category: 'callback',
        transOrderNo,
        details: callbackData
      });

      // Still try to process with PaymentService
      const result = await paymentService.processCallback(processedData, transOrderNo);
      
      if (result.success) {
        callbackLog.transactionFound = true;
        callbackLog.transactionId = result.transaction?._id;
        await callbackLog.markAsProcessed(result, 'Unencrypted callback processed');
      } else {
        await callbackLog.markAsFailed(new Error(result.message), 'Transaction not found for unencrypted callback');
      }

      const responseData = {
        success: true,
        message: 'Callback received and processed',
        data: callbackData
      };

      await callbackLog.setResponse(200, responseData);
      
      return res.json(responseData);
    }

  } catch (error) {
    console.error('❌ Payment callback error:', error.message);
    
    await loggingService.error('Callback processing failed', error, {
      category: 'callback',
      module: 'paymentRoutes',
      function: 'callback',
      transOrderNo: callbackLog?.transOrderNo,
      details: {
        requestBody: req.body,
        requestId
      }
    });

    if (callbackLog) {
      await callbackLog.markAsFailed(error, 'Exception during callback processing');
      const errorResponse = {
        success: false,
        message: 'Callback processing failed',
        error: error.message,
        requestId
      };
      await callbackLog.setResponse(500, errorResponse);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message,
      requestId
    });
  } finally {
    loggingService.clearContext();
  }
});

// GET /api/payment/status/:transOrderNo - Check payment status
router.get('/payment/status/:transOrderNo', async (req, res) => {
  const requestId = require('crypto').randomUUID();
  
  try {
    const { transOrderNo } = req.params;
    
    console.log('🔍 Payment status check for:', transOrderNo);

    // Set logging context
    loggingService.setRequestId(requestId).setContext({
      httpMethod: req.method,
      httpUrl: req.originalUrl,
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
      transOrderNo
    });

    await loggingService.info('Payment status check requested', {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment/status',
      transOrderNo,
      details: { transOrderNo }
    });

    // Get transaction status using PaymentService
    const result = await paymentService.getTransactionStatus(transOrderNo);

    if (!result.success) {
      await loggingService.warn('Transaction not found for status check', {
        category: 'api',
        module: 'paymentRoutes',
        function: 'payment/status',
        transOrderNo,
        details: { message: result.message }
      });

      return res.status(404).json({
        success: false,
        message: result.message,
        requestId
      });
    }

    await loggingService.info('Payment status retrieved successfully', {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment/status',
      transOrderNo,
      details: {
        status: result.data.orderStatus,
        statusDescription: result.data.statusDescription
      }
    });

    return res.json({
      success: true,
      message: 'Payment status retrieved',
      data: result.data,
      requestId
    });

  } catch (error) {
    console.error('❌ Payment status check error:', error.message);
    
    await loggingService.error('Payment status check failed', error, {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment/status',
      transOrderNo: req.params.transOrderNo,
      details: { requestId }
    });
    
    return res.status(500).json({
      success: false,
      message: 'Payment status check failed',
      error: error.message,
      requestId
    });
  } finally {
    loggingService.clearContext();
  }
});

// POST /api/payment/test - Test payment integration
router.post('/payment/test', async (req, res) => {
  const requestId = require('crypto').randomUUID();
  
  try {
    console.log('🧪 Testing payment integration...');

    // Set logging context
    loggingService.setRequestId(requestId).setContext({
      httpMethod: req.method,
      httpUrl: req.originalUrl,
      clientIp: req.ip,
      userAgent: req.headers['user-agent']
    });

    await loggingService.info('Payment integration test started', {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment/test',
      details: { requestId }
    });

    const result = await paymentService.testC2BPush();

    await loggingService.info('Payment integration test completed', {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment/test',
      details: {
        success: result.success,
        requestId
      }
    });

    return res.json({
      success: true,
      message: 'Payment test completed',
      data: result,
      requestId
    });

  } catch (error) {
    console.error('❌ Payment test error:', error.message);
    
    await loggingService.error('Payment integration test failed', error, {
      category: 'api',
      module: 'paymentRoutes',
      function: 'payment/test',
      details: { requestId }
    });
    
    return res.status(500).json({
      success: false,
      message: 'Payment test failed',
      error: error.message,
      requestId
    });
  } finally {
    loggingService.clearContext();
  }
});

// GET /api/admin/logs/:transOrderNo - Get logs for a specific transaction (admin endpoint)
router.get('/admin/logs/:transOrderNo', async (req, res) => {
  const requestId = require('crypto').randomUUID();
  
  try {
    const { transOrderNo } = req.params;

    loggingService.setRequestId(requestId).setContext({
      transOrderNo,
      module: 'paymentRoutes',
      function: 'admin/logs'
    });

    const [transactionLogs, callbackLogs, transaction] = await Promise.all([
      loggingService.getTransactionLogs(transOrderNo),
      loggingService.getCallbackLogs(transOrderNo),
      OneTransaction.findByTransOrderNo(transOrderNo)
    ]);

    return res.json({
      success: true,
      data: {
        transOrderNo,
        transaction: transaction?.toObject(),
        logs: transactionLogs,
        callbackLogs: callbackLogs
      }
    });

  } catch (error) {
    await loggingService.error('Failed to retrieve transaction logs', error, {
      category: 'api',
      module: 'paymentRoutes',
      function: 'admin/logs'
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
      error: error.message,
      requestId
    });
  } finally {
    loggingService.clearContext();
  }
});

// GET /api/admin/summary - Get logging and transaction summary (admin endpoint)
router.get('/admin/summary', async (req, res) => {
  const requestId = require('crypto').randomUUID();
  
  try {
    const { hours = 24 } = req.query;
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const endDate = new Date();

    loggingService.setRequestId(requestId);

    const [logSummary, transactionSummary, recentErrors, callbackStats] = await Promise.all([
      loggingService.getLogSummary(startDate, endDate),
      OneTransaction.getTransactionSummary(startDate, endDate),
      loggingService.getRecentLogs(hours, 'error'),
      CallbackLog.getCallbackStats(startDate, endDate)
    ]);

    return res.json({
      success: true,
      data: {
        period: {
          hours: parseInt(hours),
          startDate,
          endDate
        },
        logs: logSummary,
        transactions: transactionSummary,
        recentErrors: recentErrors.slice(0, 10), // Last 10 errors
        callbacks: callbackStats
      }
    });

  } catch (error) {
    await loggingService.error('Failed to generate admin summary', error, {
      category: 'api',
      module: 'paymentRoutes',
      function: 'admin/summary'
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to generate summary',
      error: error.message,
      requestId
    });
  } finally {
    loggingService.clearContext();
  }
});

module.exports = router;