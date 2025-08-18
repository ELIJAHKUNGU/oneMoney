const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const EncryptionUtil = require('./encryption');
const { OneMoneyResponse, OneMoneyCustomer, BaseReqDTO } = require('./models');

const oneMoneyPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzT00cO3c0GKpFSRA2JTf
YKiPfwthrG3Q1PRaOEm1rdBkGWEL3120Ukh/OBRPpzSJHgffyivWtdxUIREEFehd
ARG3Ru/nhehmPbzODLInVUXib6VTmyc+o9NssQwzuqyXtHCpFOAcZUyIliI12MRE
z3pWRFdU9vutPE7egBdiInzRdm5hC1z809Q/OA4HkosQqpvHF24Tmjfvj97gUY/z
wrX0dY5PRsIlJjuV1K5zhXu3TDYbbC8Nyclmbsk1AYGS9kQKtJsYWaN4zIM8svz5
IGT8Mg/FTARGKyhSXDR0lJ3ZvLYdvrVNu1XD5/OR6m+9Z1BbWeYPwXK5tGe9LEH2
nQIDAQAB
-----END PUBLIC KEY-----`.trim();
/**
 * OneMoney API Client - matches Java OneMoneyAPIClient structure
 * @param {string} baseUrl - This is the BaseURL for the OneMoney API
 * @param {string} thirdPartyId - This is the ID given to caller from platform
 * @param {string} thirdPartyCredential - This is the password given to the caller (must be encrypted using EncryptionUtil.encryptCredential)
 */
class OneMoneyClient {
  constructor(baseUrl, thirdPartyId, thirdPartyCredential, privateKey = null) {
    try {
      this.baseUrl = baseUrl || 'http://172.28.255.24:8087';
      this.thirdPartyId = thirdPartyId || '1883151315996622850';
      this.thirdPartyCredential = thirdPartyCredential;
      
      if (privateKey) {
        this.encryptionUtil = new EncryptionUtil(privateKey, oneMoneyPublicKey);
      }
      
      // API endpoints like Java implementation
      this.endpoints = {
        registerCustomer: '/api/internal/user/registration',
        uploadFile: '/api/internal/oss/uploadFile',
        c2bPush: '/api/pay/payment/push',
        c2bQuery: '/api/pay/payment/order/status/query',
        b2cPayment: '/api/thirdParty/paying',
        b2cQuery: '/api/thirdParty/paying/order/check'
      };
    } catch (error) {
      console.error('Client initialization error:', error);
      throw error;
    }
  }

  /**
   * Register a new customer - matches Java registerCustomer method
   * @param {OneMoneyCustomer} oneMoneyCustomer - Customer to be registered
   * @returns {Promise<OneMoneyResponse>} OneMoney Generalized API response with statusCode (Http status codes) as int and body a JsonString
   */
  async registerCustomer(oneMoneyCustomer) {
    const payload = JSON.stringify(oneMoneyCustomer);
    const url = `${this.baseUrl}${this.endpoints.registerCustomer}`;
    console.log(payload, "payload")
    console.log(url, "url")

    
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ThirdPartyID': this.thirdPartyId,
          'Password': this.thirdPartyCredential
        }
      });
      
      this.log(`Registering new customer: ${oneMoneyCustomer.mobile}`);
      this.log(`Customer: ${oneMoneyCustomer.mobile} registration response: ${JSON.stringify(response.data)}`);
      
      return new OneMoneyResponse(response.status, JSON.stringify(response.data));
    } catch (error) {
      console.error('Customer registration failed:', error.response?.data || error.message);
      const statusCode = error.response?.status || 500;
      const body = JSON.stringify(error.response?.data || { error: error.message });
      return new OneMoneyResponse(statusCode, body);
    }
  }

  /**
   * Upload a picture file - matches Java uploadPicture method
   * @param {string} filePath - Path to the file to upload
   * @returns {Promise<OneMoneyResponse>} OneMoney response
   */
  async uploadPicture(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), {
        filename: path.basename(filePath),
        contentType: 'application/octet-stream'
      });
      
      const url = `${this.baseUrl}${this.endpoints.uploadFile}`;
      
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'ThirdPartyID': this.thirdPartyId,
          'Password': this.thirdPartyCredential
        }
      });
      
      this.log(`Uploading image to OneMoney ${path.basename(filePath)}`);
      this.log(`Image upload response: ${JSON.stringify(response.data)}`);
      
      return new OneMoneyResponse(response.status, JSON.stringify(response.data));
    } catch (error) {
      console.error('File upload failed:', error.response?.data || error.message);
      const statusCode = error.response?.status || 500;
      const body = JSON.stringify(error.response?.data || { error: error.message });
      return new OneMoneyResponse(statusCode, body);
    }
  }

  /**
   * Make encrypted API request - for payment operations
   * @private
   */
  async makeEncryptedRequest(endpoint, businessParams) {
    try {
      if (!this.encryptionUtil) {
        throw new Error('EncryptionUtil not initialized. Provide privateKey in constructor.');
      }
      
      // IMPORTANT: Generate signature BEFORE encryption, from original JSON string
      const businessParamsStr = JSON.stringify(businessParams);
      const signature = this.encryptionUtil.generateSignature(businessParamsStr);
      const notifyUrl = this.encryptionUtil.generateSignature(businessParams?.notifyUrl);

      
      // Generate AES key and encrypt data
      const aesKey = this.encryptionUtil.generateAesKey();
      const encryptedData = this.encryptionUtil.aesEncrypt(businessParamsStr, aesKey);
      const encryptedKey = this.encryptionUtil.rsaEncrypt(aesKey);

      const encryptedId = "6c12e964cd59"

      
      // Create BaseReqDTO equivalent
      const baseReq = new BaseReqDTO();
      baseReq.setMerNo(this.thirdPartyId)
            .setEncryptData(encryptedData)
            .setEncryptKey(encryptedKey)
            .setEncryptKeyId(encryptedId)
            .setSignData(signature)
            .setNotifyUrl(notifyUrl);

      console.log(baseReq, "payload")
      const response = await axios.post(`${this.baseUrl}${endpoint}`, baseReq);
      return this.processResponse(response);
    } catch (error) {
      console.error('API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Process API response - matches Java response handling
   * @private
   */
  processResponse(response) {
    // Create OneMoneyResponse like Java implementation
    const oneMoneyResponse = new OneMoneyResponse(response.status, JSON.stringify(response.data));
    
    // TODO: In a real implementation, you would decrypt the response here if needed
    // For now, return the structured response
    return oneMoneyResponse;
  }

  // Payment API Methods (require encryption)
  
  /**
   * C2B Push Payment
   * @param {Object} params - Payment parameters
   * @returns {Promise<OneMoneyResponse>}
   */
  async c2bPushPayment(params) {
    const requiredParams = ['transOrderNo', 'amt', 'currency', 'mobileNo', 'goodsName'];
    this.validateParams(params, requiredParams);
    
    const businessParams = {
      ...params,
      notifyUrl: params.notifyUrl || 'http://yourdomain.com/onemoney/notify'
    };
    
    return this.makeEncryptedRequest(this.endpoints.c2bPush, businessParams);
  }

  /**
   * C2B Transaction Query
   * @param {string} transOrderNo - Transaction order number
   * @returns {Promise<OneMoneyResponse>}
   */
  async c2bQuery(transOrderNo) {
    return this.makeEncryptedRequest(this.endpoints.c2bQuery, { transOrderNo });
  }

  /**
   * B2C Payment
   * @param {Object} params - Payment parameters
   * @returns {Promise<OneMoneyResponse>}
   */
  async b2cPayment(params) {
    const requiredParams = ['transOrderNo', 'orderAmt', 'currency', 'recCstMobile', 'businessType'];
    this.validateParams(params, requiredParams);
    
    const businessParams = {
      ...params,
      remark: params.remark || 'B2C Payment',
      notifyUrl: params.notifyUrl || 'http://yourdomain.com/onemoney/notify',
      recCstIdNumber: params.recCstIdNumber || '000000000Z00'
    };
    
    return this.makeEncryptedRequest(this.endpoints.b2cPayment, businessParams);
  }

  /**
   * Validate required parameters
   * @private
   */
  validateParams(params, requiredParams) {
    requiredParams.forEach(param => {
      if (!params[param]) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    });
  }

  /**
   * Log messages - matches Java implementation
   * @private
   */
  log(text) {
    console.log('=========> ' + text);
  }
}

module.exports = OneMoneyClient;