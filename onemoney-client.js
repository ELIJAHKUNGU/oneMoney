const axios = require('axios');
const config = require('./config/config');
const EncryptionUtil = require('./encryption');

const oneMoneyPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuNiac4lHvaf7u1c+hGmV
uFPeY6yNUStDB9CqS+LqafsMxqrYFVpnQ1Zyjyz476SvYuW2z/OrTKI0xi2NbJIW
IPEEn/Wk5MEFRNX5gGymkTtYsrtBaBy6Y3ItNUn01DmkErFiUlS6RQoi920GTmgc
JtcjYqyrfQ5N5wQutX+R80GEKWrIZgXkUtldFZN2rOQW3e68TfXTV3yUZ9/c1sbc
TCSde5JleqIrjVT+066VY/uIU5pa5vR2w+Xd33C+R5Ai2Hf4Ah6wykgKQHg4EJF3
RYJO3LoF1V0Yf/61rVztrvG8OcU2/9neGdp1wRK4mVrzzRl55c9YXVLmaSqHTxoh
CwIDAQAB
-----END PUBLIC KEY-----`.trim();
//   merchantId: '1883151315996622850',
  // encryptKeyId: '6c12e964cd59',
class OneMoneyClient {
  constructor(privateKey) {
    try {
      this.encryptionUtil = new EncryptionUtil(privateKey, oneMoneyPublicKey);
      this.config = {
        encryptKeyId: '6c12e964cd59',
        merchantId: '1883151315996622850',
        apiEndpoints: {
          c2bPush: 'http://172.28.255.24:8087/api/pay/payment/push',
          c2bQuery: 'http://172.28.255.24:8087/api/pay/payment/order/status/query',
          b2cPayment: 'http://172.28.255.24:8087/api/thirdParty/paying',
          b2cQuery: 'http://172.28.255.24:8087/api/thirdParty/paying/order/check'
        },
        notifyUrl: 'http://yourdomain.com/onemoney/notify'
      };
    } catch (error) {
      console.error('Client initialization error:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, businessParams) {
    try {
      // Generate AES key and encrypt data
      const aesKey = this.encryptionUtil.generateAesKey();
      const encryptedData = this.encryptionUtil.aesEncrypt(JSON.stringify(businessParams), aesKey);
      const encryptedKey = this.encryptionUtil.rsaEncrypt(aesKey);
      const signature = this.encryptionUtil.generateSignature(businessParams);
      
      // Prepare request payload
      const { timestamp, random } = this.encryptionUtil.generateRequestMeta();
      const payload = {
        timestamp,
        random,
        encryptKeyId: this.config.encryptKeyId,
        merNo: this.config.merchantId,
        encryptData: encryptedData.encryptedData,
        encryptKey: encryptedKey,
        signData: signature
      };

      // Make API request
      const response = await axios.post(endpoint, payload);
      return this.processResponse(response.data);
    } catch (error) {
      console.error('API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  processResponse(response) {
    // In a real implementation, you would decrypt the response here
    return response;
  }

  // C2B Push Payment
  async c2bPushPayment(params) {
    const requiredParams = ['transOrderNo', 'amt', 'currency', 'mobileNo', 'goodsName'];
    this.validateParams(params, requiredParams);
    
    const businessParams = {
      ...params,
      notifyUrl: params.notifyUrl || this.config.notifyUrl
    };
    
    return this.makeRequest(this.config.apiEndpoints.c2bPush, businessParams);
  }

  // C2B Transaction Query
  async c2bQuery(transOrderNo) {
    return this.makeRequest(this.config.apiEndpoints.c2bQuery, { transOrderNo });
  }

  // B2C Payment
  async b2cPayment(params) {
    const requiredParams = ['transOrderNo', 'orderAmt', 'currency', 'recCstMobile', 'businessType'];
    this.validateParams(params, requiredParams);
    
    const businessParams = {
      ...params,
      remark: params.remark || 'B2C Payment',
      notifyUrl: params.notifyUrl || this.config.notifyUrl,
      recCstIdNumber: params.recCstIdNumber || '000000000Z00'
    };
    
    return this.makeRequest(this.config.apiEndpoints.b2cPayment, businessParams);
  }

  // Validate required parameters
  validateParams(params, requiredParams) {
    requiredParams.forEach(param => {
      if (!params[param]) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    });
  }
}

module.exports = OneMoneyClient;