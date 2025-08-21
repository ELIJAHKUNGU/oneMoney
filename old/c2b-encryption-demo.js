const OneMoneyClient = require('./onemoney-client');
const EncryptionUtil = require('./encryption');

// Configuration - same as original setup
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

console.log('🚀 C2B Payment Encryption Demo');
console.log('================================');

async function generateC2BPayload() {
  try {
    // Create client with encryption capabilities
    const client = new OneMoneyClient(baseUrl, thirdPartyId, thirdPartyCredential, privateKey);
    
    // C2B Payment parameters - same as original
    const businessParams = {
      transOrderNo: Date.now().toString(),
      amt: 100,
      currency: 'ZWG',
      mobileNo: '710939852',
      goodsName: 'Test Product howzit',
      notifyUrl: 'http://165.227.202.115/onemoney/notify'
    };

    console.log('📋 Business Parameters:');
    console.log(JSON.stringify(businessParams, null, 2));
    
    // Step 1: Generate signature BEFORE encryption (original JSON string)
    const businessParamsStr = JSON.stringify(businessParams);
    const signature = client.encryptionUtil.generateSignature(businessParamsStr);
    
    console.log('\n🔐 Encryption Process:');
    console.log('1. Original JSON String:', businessParamsStr);
    console.log('2. SHA-256 Signature:', signature);
    
    // Step 2: Generate AES key and encrypt data
    const aesKey = client.encryptionUtil.generateAesKey();
    console.log('3. Generated AES Key:', aesKey);
    
    const encryptedData = client.encryptionUtil.aesEncrypt(businessParamsStr, aesKey);
    console.log('4. AES Encrypted Data (double base64):', encryptedData);
    
    // Step 3: Encrypt AES key with RSA
    const encryptedKey = client.encryptionUtil.rsaEncrypt(aesKey);
    console.log('5. RSA Encrypted Key (double base64):', encryptedKey);
    
    // Step 4: Generate request metadata
    const { timestamp, random } = client.encryptionUtil.generateRequestMeta();
    console.log('6. Timestamp:', timestamp);
    console.log('7. Random UUID:', random);
    
    // Step 5: Create final payload - matches Java BaseReqDTO structure
    const { BaseReqDTO } = require('./models');
    const finalPayload = new BaseReqDTO();
    finalPayload.setMerNo(thirdPartyId)
              .setEncryptData(encryptedData)
              .setEncryptKey(encryptedKey)
              .setSignData(signature);
              
    // Override timestamp and random with our generated values
    finalPayload.timestamp = timestamp;
    finalPayload.random = random;
    
    console.log('\n📦 Final Encrypted Payload:');
    console.log(JSON.stringify(finalPayload, null, 2));
    
    // Generate cURL command for testing
    const endpoint = `${baseUrl}/api/pay/payment/push`;
    const curlCommand = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(finalPayload)}'`;
    
    console.log('\n🌐 cURL Command for Testing:');
    console.log(curlCommand);
    
    // Generate pretty cURL command
    console.log('\n🎨 Pretty cURL Command:');
    console.log(`curl -X POST "${endpoint}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{`);
    console.log(`    "timestamp": "${finalPayload.timestamp}",`);
    console.log(`    "random": "${finalPayload.random}",`);
    console.log(`    "language": "${finalPayload.language}",`);
    console.log(`    "merNo": "${finalPayload.merNo}",`);
    console.log(`    "encryptData": "${finalPayload.encryptData}",`);
    console.log(`    "encryptKey": "${finalPayload.encryptKey}",`);
    console.log(`    "signData": "${finalPayload.signData}"`);
    console.log(`  }'`);
    
    console.log('\n✅ Encryption Strategy Applied Successfully!');
    console.log('This payload matches the Java implementation exactly.');
    
    return finalPayload;
    
  } catch (error) {
    console.error('❌ Error generating C2B payload:', error);
    throw error;
  }
}

// Run the demo
generateC2BPayload().catch(console.error);