const OneMoneyClient = require('./onemoney-client');
const EncryptionUtil = require('./encryption');
const crypto = require('crypto');

// Configuration
const baseUrl = 'http://172.28.255.24:8087';
const thirdPartyId = '1883151315996622850';
const plainPassword = '#3Wbetlni';
const thirdPartyCredential = EncryptionUtil.encryptCredential(plainPassword);

// Private key for encryption
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

console.log('🔍 Debugging Signature Generation');
console.log('==================================');

async function debugSignature() {
  try {
    const client = new OneMoneyClient(baseUrl, thirdPartyId, thirdPartyCredential, privateKey);
    
    // Test data - same as what we're sending
    const businessParams = {
      transOrderNo: Date.now().toString(),
      amt: 100,
      currency: 'ZWG',
      mobileNo: '710939852',
      goodsName: 'Test Product howzit'
    };

    const businessParamsStr = JSON.stringify(businessParams);
    console.log('📋 Business Parameters JSON:');
    console.log(businessParamsStr);
    console.log('Length:', businessParamsStr.length);
    
    // Test our signature generation method
    const ourSignature = client.encryptionUtil.generateSignature(businessParamsStr);
    console.log('\n🔐 Our Generated Signature:');
    console.log(ourSignature);
    
    // Also test with native crypto to compare
    const nativeSignature = crypto.createHash('sha256').update(businessParamsStr).digest('hex');
    console.log('\n🔐 Native Crypto Signature:');
    console.log(nativeSignature);
    
    console.log('\n✅ Signatures Match:', ourSignature === nativeSignature);
    
    // Test with different encodings
    const utf8Signature = crypto.createHash('sha256').update(businessParamsStr, 'utf8').digest('hex');
    console.log('\n🔐 UTF-8 Explicit Signature:');
    console.log(utf8Signature);
    
    // Test with sorted JSON keys (some APIs require this)
    const sortedJson = JSON.stringify(businessParams, Object.keys(businessParams).sort());
    const sortedSignature = crypto.createHash('sha256').update(sortedJson).digest('hex');
    console.log('\n🔐 Sorted Keys JSON:');
    console.log(sortedJson);
    console.log('🔐 Sorted Keys Signature:');
    console.log(sortedSignature);
    
    // Test without spaces in JSON
    const compactJson = JSON.stringify(businessParams);
    const compactSignature = crypto.createHash('sha256').update(compactJson).digest('hex');
    console.log('\n🔐 Compact JSON:');
    console.log(compactJson);
    console.log('🔐 Compact Signature:');
    console.log(compactSignature);
    
    console.log('\n📊 Signature Comparison:');
    console.log('Our Method    :', ourSignature);
    console.log('Native        :', nativeSignature);
    console.log('UTF-8 Explicit:', utf8Signature);
    console.log('Sorted Keys   :', sortedSignature);
    console.log('Compact       :', compactSignature);
    
    // Test if we should sign the entire request payload instead of just business params
    const { BaseReqDTO } = require('./models');
    const baseReq = new BaseReqDTO();
    baseReq.setMerNo(thirdPartyId);
    
    // Remove signature field for signing
    const requestForSigning = {
      timestamp: baseReq.timestamp,
      random: baseReq.random,
      language: baseReq.language,
      merNo: baseReq.merNo
    };
    
    const requestSignature = crypto.createHash('sha256').update(JSON.stringify(requestForSigning)).digest('hex');
    console.log('\n🔐 Request Metadata Signature:');
    console.log(JSON.stringify(requestForSigning));
    console.log('Signature:', requestSignature);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSignature();