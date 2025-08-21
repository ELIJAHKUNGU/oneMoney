const OneMoneyClient = require('./onemoney-client');

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAuNiac4lHvaf7u1c+hGmVuFPeY6yNUStDB9CqS+LqafsMxqrY
FVpnQ1Zyjyz476SvYuW2z/OrTKI0xi2NbJIWIPEEn/Wk5MEFRNX5gGymkTtYsrtB
aBy6Y3ItNUn01DmkErFiUlS6RQoi920GTmgcJtcjYqyrfQ5N5wQutX+R80GEKWrI
ZgXkUtldFZN2rOQW3e68TfXTV3yUZ9/c1sbcTCSde5JleqIrjVT+066VY/uIU5pa
5vR2w+Xd33C+R5Ai2Hf4Ah6wykgKQHg4EJF3RYJO3LoF1V0Yf/61rVztrvG8OcU2
/9neGdp1wRK4mVrzzRl55c9YXVLmaSqHTxohCwIDAQABAoIBAQCRYnwIh18PwoHy
FWqshscllYGC8AKuZtJv4SUwTqeE99pSn6kZEmPJyMKN7hdVlTgFFxw0bzi6K5JK
lSV40WXqPuceUPyCl3Znb8yvv8U60WywFywYkQ/gi7sXALY5/aQYt7/XdaCUEKbz
6KJfJO+PdQL1501yLMAFBXsfcdj/c6Anhja+jjwnPbkYqrEJyEm+Y2f3NmwsL5+P
j8sGnFrivKu0K9uXEznzhdArViQ0Wh47xarl6lPluMwZPfR/K7VUK++FPQoTmoSX
iS9DHQGCq6ogmg1WUxK4ZkZxBKg5XojEo8oHkiQis0eB8BLHA4hrBV2V3MTcbzPc
SjZo0w0hAoGBANpZpnYvnBeaCwRJukY82IrUIPPm+9sUWpUQ2xSyWAotjt9AXhmV
VWUGvM/z8YYbrd+38tDFPhPjccSMTt8rD52C20ec0N9fG/bi7jEpDT8syTmim1LG
1oQCLhAyabq+EXwUKsS12sDjD1EPnrzQ3ii9R1axHaEyyg02U0ouq8YTAoGBANi4
BoW9kKdROgR+eOvWwR9R0kfZEEMfkG6xBg9rKwBpQzLebGiROVd49TIyHsgXUBRP
jJu0fAWHASgVtQdDrSB8jXama88NKhujovbmqTI1Po6TXayWrHBgzluQNfi22rKJ
uVMNp0oB0wyCsPAi7L1SZui8HgUdBomecXkWF/gpAoGAVBsMP6H/Iig37iLoGX3+
extSxiBHCxBABANGICbCOslpqx0EIh6fkhaSTBfPBLVMuEwGv9v6GXcWr3rMNrJD
hYyOInuJCUF9aA/paA5EB/2cVRMJeU0V/CtKyvpgN4pW+dBa2QKjjIDpuXOm1Vwu
9spR3FbE7v69TXGLi5uGlvkCgYEAoBpTtzn0Q6eeVPOaIaDly12HG80gVnZbHWtq
LrndatBY9JudOyMOWbDic9LTKr8OSfL6zYzokqzKDfL7agJ1RCq/14fa3Xu8P+8D
1aNSG+V58Zqs+XPWsK7TxJElTjjIGF3mq5TKocH3SKbEUKN8geD+ZbGT+/MVgVWs
PugzjQECgYEAmcIFuyK9AJPUMQdAEce2uhJYl944FqPdVL5kjwCcazDGb777Vcbe
Fj6QzHyyf5WWFk2ByC65mG6cs9jD0Mys3Ko5nJEyxXaNwOEHPILrTkI46Osk7OeX
sHpPFbUtT4J0IkUWYJzAFtTIVi4J3B8VDHHCpBqDWX5IKdE+NT0A0GY=
-----END RSA PRIVATE KEY-----`;

const client = new OneMoneyClient(privateKey);

async function generateCleanCurl() {
  try {
    // C2B Payment
    const businessParams = {
      transOrderNo: Date.now().toString(),
      amt: 100,
      currency: 'ZWG',
      mobileNo: '710939852',
      goodsName: 'Test Product',
      notifyUrl: 'http://165.227.202.115/onemoney/notify'
    };

    const businessParamsStr = JSON.stringify(businessParams);
    const signature = client.encryptionUtil.generateSignature(businessParamsStr);
    
    const aesKey = client.encryptionUtil.generateAesKey();
    const encryptedData = client.encryptionUtil.aesEncrypt(businessParamsStr, aesKey);
    const encryptedKey = client.encryptionUtil.rsaEncrypt(aesKey);
    
    const { timestamp, random } = client.encryptionUtil.generateRequestMeta();
    
    const payload = {
      timestamp,
      random,
      encryptKeyId: client.config.encryptKeyId,
      merNo: client.config.merchantId,
      encryptData: encryptedData,
      encryptKey: encryptedKey,
      signData: signature
    };

    // Generate single-line curl command
    const curlCommand = `curl -X POST "http://172.28.255.24:8087/api/pay/payment/push" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`;
    
    console.log('=== C2B PUSH PAYMENT - SINGLE LINE CURL ===');
    console.log(curlCommand);
    console.log('\n');

    // B2C Payment
    const b2cParams = {
      transOrderNo: Date.now().toString(),
      orderAmt: 50,
      currency: 'ZWG',
      recCstMobile: '712984123',
      recCstIdNumber: '000000000Z00',
      businessType: '1',
      remark: 'Test B2C Payment',
      notifyUrl: 'http://165.227.202.115/onemoney/notify'
    };

    const b2cParamsStr = JSON.stringify(b2cParams);
    const b2cSignature = client.encryptionUtil.generateSignature(b2cParamsStr);
    
    const b2cAesKey = client.encryptionUtil.generateAesKey();
    const b2cEncryptedData = client.encryptionUtil.aesEncrypt(b2cParamsStr, b2cAesKey);
    const b2cEncryptedKey = client.encryptionUtil.rsaEncrypt(b2cAesKey);
    
    const { timestamp: b2cTimestamp, random: b2cRandom } = client.encryptionUtil.generateRequestMeta();
    
    const b2cPayload = {
      timestamp: b2cTimestamp,
      random: b2cRandom,
      encryptKeyId: client.config.encryptKeyId,
      merNo: client.config.merchantId,
      encryptData: b2cEncryptedData,
      encryptKey: b2cEncryptedKey,
      signData: b2cSignature
    };

    const b2cCurlCommand = `curl -X POST "http://172.28.255.24:8087/api/thirdParty/paying" -H "Content-Type: application/json" -d '${JSON.stringify(b2cPayload)}'`;
    
    console.log('=== B2C PAYMENT - SINGLE LINE CURL ===');
    console.log(b2cCurlCommand);
    console.log('\n');

    // Query example
    const queryParams = { transOrderNo: businessParams.transOrderNo };
    const queryParamsStr = JSON.stringify(queryParams);
    const querySignature = client.encryptionUtil.generateSignature(queryParamsStr);
    
    const queryAesKey = client.encryptionUtil.generateAesKey();
    const queryEncryptedData = client.encryptionUtil.aesEncrypt(queryParamsStr, queryAesKey);
    const queryEncryptedKey = client.encryptionUtil.rsaEncrypt(queryAesKey);
    
    const { timestamp: qTimestamp, random: qRandom } = client.encryptionUtil.generateRequestMeta();
    
    const queryPayload = {
      timestamp: qTimestamp,
      random: qRandom,
      encryptKeyId: client.config.encryptKeyId,
      merNo: client.config.merchantId,
      encryptData: queryEncryptedData,
      encryptKey: queryEncryptedKey,
      signData: querySignature
    };

    const queryCurlCommand = `curl -X POST "http://172.28.255.24:8087/api/pay/payment/order/status/query" -H "Content-Type: application/json" -d '${JSON.stringify(queryPayload)}'`;
    
    console.log('=== C2B QUERY - SINGLE LINE CURL ===');
    console.log(queryCurlCommand);

  } catch (error) {
    console.error('Error:', error);
  }
}

generateCleanCurl();