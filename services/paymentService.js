const axios = require('axios');
const CryptoService = require('./cryptoService');
const config = require('../config/constants');

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
  async initiatePayment(paymentData) {
    try {
      const { payload, jsonPayload } = this.createPaymentPayload(paymentData);

      console.log('🔒 Payment encrypted, sending to OneMoney...');

      // Send to OneMoney API
      const response = await axios.post(config.ONEMONEY_ENDPOINT, payload);
      
      console.log('📡 OneMoney Response:', response?.data);

      return { response: response.data, originalPayload: jsonPayload };
    } catch (error) {
      console.error('❌ Payment API Error:', error.message);
      throw new Error(`Payment request failed: ${error.message}`);
    }
  }

  // Process OneMoney response
  processPaymentResponse(responseData) {
    // Check if we got encrypted response to decrypt
    if (responseData.data && responseData.encryptKey) {
      console.log('🔓 Decrypting OneMoney response...');
      
      const decryptionPayload = {
        encryptData: responseData.data,
        encryptKey: responseData.encryptKey,
        signData: responseData.signData
      };
      
      const decryptResult = this.cryptoService.decryptMessage(decryptionPayload, config.HOWZIT_PRIVATE_KEY);
      
      if (decryptResult && decryptResult.originalPayload) {
        const transaction = decryptResult.originalPayload;
        
        return {
          success: true,
          message: 'Payment initiated successfully',
          apiResponse: {
            status: responseData.status,
            code: responseData.code,
            success: responseData.success
          },
          transaction: {
            transOrderNo: transaction.transOrderNo,
            orderNo: transaction.orderNo,
            orderAmt: transaction.orderAmt,
            currency: transaction.currency,
            actAmt: transaction.actAmt,
            feeAmt: transaction.feeAmt,
            taxAmt: transaction.taxAmt,
            orderStatus: transaction.orderStatus,
            statusDescription: this.getStatusDescription(transaction.orderStatus),
            signatureValid: decryptResult.isValid
          }
        };
      }
    }

    // Return raw response if no decryption needed
    return {
      success: true,
      message: 'Payment request sent successfully',
      response: responseData || {}
    };
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
      const processedResult = this.processPaymentResponse(result.response);
      
      console.log('Test C2B Push Result:', processedResult);
      return processedResult;
    } catch (error) {
      console.error('Test C2B Push Error:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;