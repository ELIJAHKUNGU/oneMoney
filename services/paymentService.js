const axios = require('axios');
const CryptoService = require('./cryptoService');
const config = require('../config/constants');
const OneTransaction = require('../models/OneTransaction');
const loggingService = require('./loggingService');

class PaymentService {
  constructor() {
    this.cryptoService = new CryptoService(config.ONEMONEY_PUBLIC_KEY, config.HOWZIT_PRIVATE_KEY);
  }

  // Create payment payload
  createPaymentPayload(paymentData) {
    const TIMESTAMP = Date.now();
    const jsonPayload = JSON.stringify({
      transOrderNo: TIMESTAMP.toString(),
      orderAmt: parseFloat(paymentData.orderAmt),
      currency: paymentData.currency.toUpperCase(),
      mobileNo: paymentData.mobileNo,
      goodsName: paymentData.goodsName || "Howzit Payment",
      notifyUrl: config.NOTIFY_URL,
    });

    const secretKey = config.SECRET_KEY;

    // Encrypt
    const encryptData = this.cryptoService.encryptPayload(jsonPayload, secretKey);
    const encryptKey = this.cryptoService.encryptSecretKey(secretKey);
    const signData = this.cryptoService.signWithSha256(jsonPayload);

    // Build structured object
    const payload = {
      timestamp: TIMESTAMP,
      random: TIMESTAMP,
      encryptKeyId: config.ENCRYPT_KEY_ID,
      merNo: config.MERCHANT_NUMBER,
      encryptData,
      encryptKey,
      signData,
    };

    return { payload, jsonPayload };
  }

  // Send payment request to OneMoney API
  async initiatePayment(paymentData, clientInfo = {}) {
    let transaction = null;
    const startTime = Date.now();
    
    try {
      const { payload, jsonPayload } = this.createPaymentPayload(paymentData);
      const parsedPayload = JSON.parse(jsonPayload);
      const transOrderNo = parsedPayload.transOrderNo;

      // Set logging context
      loggingService.setContext({
        transOrderNo,
        module: 'PaymentService',
        function: 'initiatePayment'
      });

      // Create transaction record
      transaction = new OneTransaction({
        transOrderNo,
        mobileNo: paymentData.mobileNo,
        orderAmt: parseFloat(paymentData.orderAmt),
        currency: paymentData.currency.toUpperCase(),
        goodsName: paymentData.goodsName || "Howzit Payment",
        notifyUrl: config.NOTIFY_URL,
        requestPayload: {
          originalPayload: jsonPayload,
          encryptedPayload: payload
        },
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        orderStatus: '0', // Pending
        statusDescription: 'Payment Pending'
      });

      await transaction.save();
      await loggingService.logDatabaseOperation('create', 'OneTransaction', true);
      await loggingService.logPaymentInitiated(transOrderNo, paymentData);

      console.log('🔒 Payment encrypted, sending to OneMoney...');
      await loggingService.logApiRequest('POST', config.ONEMONEY_ENDPOINT, payload);

      // Send to OneMoney API
      const response = await axios.post(config.ONEMONEY_ENDPOINT, payload);
      const duration = Date.now() - startTime;
      
      console.log('📡 OneMoney Response:', response?.data);
      await loggingService.logApiResponse('POST', config.ONEMONEY_ENDPOINT, response.data, response.status);
      await loggingService.logPerformance('payment_api_call', duration);

      // Update transaction with API response
      transaction.apiResponse = {
        status: response.data.status,
        code: response.data.code,
        success: response.data.success,
        message: response.data.message,
        rawResponse: response.data
      };

      await transaction.save();
      await loggingService.logPaymentResponse(transOrderNo, response.data, true);

      return { response: response.data, originalPayload: jsonPayload, transaction };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Payment API Error:', error.message);
      
      await loggingService.error('Payment initiation failed', error, {
        category: 'payment',
        module: 'PaymentService',
        function: 'initiatePayment',
        transOrderNo: transaction?.transOrderNo,
        details: { paymentData, duration }
      });

      // Update transaction with error if it was created
      if (transaction) {
        transaction.apiResponse = {
          success: false,
          message: error.message,
          rawResponse: error.response?.data || null
        };
        transaction.orderStatus = '2'; // Failed
        transaction.statusDescription = 'Payment Failed';
        await transaction.save();
      }

      throw new Error(`Payment request failed: ${error.message}`);
    }
  }

  // Process OneMoney response and update transaction
  async processPaymentResponse(responseData, transaction = null) {
    try {
      // Check if we got encrypted response to decrypt
      if (responseData.data && responseData.encryptKey) {
        console.log('🔓 Decrypting OneMoney response...');
        
        await loggingService.logEncryptionEvent('response_decryption_start', true);
        
        const decryptionPayload = {
          encryptData: responseData.data,
          encryptKey: responseData.encryptKey,
          signData: responseData.signData
        };
        
        const decryptResult = this.cryptoService.decryptMessage(decryptionPayload, config.HOWZIT_PRIVATE_KEY);
        
        if (decryptResult && decryptResult.originalPayload) {
          const decryptedTransaction = decryptResult.originalPayload;
          
          await loggingService.logEncryptionEvent('response_decryption_success', true, {
            signatureValid: decryptResult.isValid
          });

          // Update transaction in database if provided
          if (transaction) {
            transaction.orderNo = decryptedTransaction.orderNo;
            transaction.actAmt = decryptedTransaction.actAmt;
            transaction.feeAmt = decryptedTransaction.feeAmt;
            transaction.taxAmt = decryptedTransaction.taxAmt;
            transaction.orderStatus = decryptedTransaction.orderStatus;
            transaction.statusDescription = this.getStatusDescription(decryptedTransaction.orderStatus);
            transaction.signatureValid = decryptResult.isValid;
            
            await transaction.save();
            await loggingService.logDatabaseOperation('update', 'OneTransaction', true);
          }
          
          return {
            success: true,
            message: 'Payment initiated successfully',
            apiResponse: {
              status: responseData.status,
              code: responseData.code,
              success: responseData.success
            },
            transaction: {
              transOrderNo: decryptedTransaction.transOrderNo,
              orderNo: decryptedTransaction.orderNo,
              orderAmt: decryptedTransaction.orderAmt,
              currency: decryptedTransaction.currency,
              actAmt: decryptedTransaction.actAmt,
              feeAmt: decryptedTransaction.feeAmt,
              taxAmt: decryptedTransaction.taxAmt,
              orderStatus: decryptedTransaction.orderStatus,
              statusDescription: this.getStatusDescription(decryptedTransaction.orderStatus),
              signatureValid: decryptResult.isValid
            }
          };
        } else {
          await loggingService.logEncryptionEvent('response_decryption_failed', false, {
            error: 'Failed to decrypt response payload'
          });
        }
      }

      // Return raw response if no decryption needed
      return {
        success: true,
        message: 'Payment request sent successfully',
        response: responseData || {}
      };
    } catch (error) {
      await loggingService.error('Failed to process payment response', error, {
        category: 'payment',
        module: 'PaymentService',
        function: 'processPaymentResponse'
      });
      throw error;
    }
  }

  // Get status description
  getStatusDescription(orderStatus) {
    const statusMap = {
      '0': 'Payment Pending',
      '1': 'Payment Successful',
      '2': 'Payment Failed',
      '3': 'Payment Cancelled',
      '4': 'Payment Processing'
    };
    return statusMap[orderStatus] || 'Unknown Status';
  }

  // Process callback from OneMoney
  async processCallback(callbackData, transOrderNo) {
    try {
      // Find the transaction
      const transaction = await OneTransaction.findByTransOrderNo(transOrderNo);
      
      if (!transaction) {
        await loggingService.warn('Callback received for unknown transaction', {
          category: 'callback',
          transOrderNo,
          details: callbackData
        });
        return { success: false, message: 'Transaction not found' };
      }

      // Update transaction with callback data
      await transaction.updateFromCallback(callbackData, true); // Assume signature is valid for now
      
      await loggingService.logCallbackProcessed(transOrderNo, true);
      
      return {
        success: true,
        message: 'Callback processed successfully',
        transaction: transaction.toObject()
      };
    } catch (error) {
      await loggingService.logCallbackProcessed(transOrderNo, false, error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(transOrderNo) {
    try {
      const transaction = await OneTransaction.findByTransOrderNo(transOrderNo);
      
      if (!transaction) {
        return { success: false, message: 'Transaction not found' };
      }

      return {
        success: true,
        data: {
          transOrderNo: transaction.transOrderNo,
          orderNo: transaction.orderNo,
          orderStatus: transaction.orderStatus,
          statusDescription: transaction.statusDescription,
          orderAmt: transaction.orderAmt,
          actAmt: transaction.actAmt,
          currency: transaction.currency,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          completedAt: transaction.completedAt
        }
      };
    } catch (error) {
      await loggingService.error('Failed to get transaction status', error, {
        category: 'payment',
        transOrderNo
      });
      throw error;
    }
  }

  // Test C2B push (for testing purposes)
  async testC2BPush() {
    try {
      const testData = {
        mobileNo: "712980059",
        orderAmt: 100,
        currency: "ZWG",
        goodsName: "Test Transaction"
      };

      const result = await this.initiatePayment(testData);
      const processedResult = await this.processPaymentResponse(result.response, result.transaction);
      
      console.log('Test C2B Push Result:', processedResult);
      return processedResult;
    } catch (error) {
      console.error('Test C2B Push Error:', error);
      await loggingService.error('Test C2B push failed', error, {
        category: 'payment',
        module: 'PaymentService',
        function: 'testC2BPush'
      });
      throw error;
    }
  }
}

module.exports = PaymentService;