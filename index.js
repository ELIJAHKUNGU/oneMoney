const OneMoneyClient = require('./onemoney-client');
const EncryptionUtil = require('./encryption');
const { OneMoneyCustomer } = require('./models');

// Replace with your actual configuration
const baseUrl = 'http://172.28.255.24:8087';
const thirdPartyId = '1883151315996622850';
const plainPassword = '#3Wbetlni'; // Your actual password
const thirdPartyCredential = EncryptionUtil.encryptCredential(plainPassword);

// Private key for encrypted operations
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

// Create client instance matching Java constructor pattern
const client = new OneMoneyClient(baseUrl, thirdPartyId, thirdPartyCredential, privateKey);

// Example Customer Registration (like Java implementation)
async function testCustomerRegistration() {
  try {
    const customer = new OneMoneyCustomer()
      .setMobile('712984123')
      .setFirstName('John')
      .setLastName('Doe')
      .setEmail('john.doe@example.com')
      .setGender('2') // Male
      .setDateOfBirth('01011990')
      .setIdType('National ID')
      .setIdNumber('63-123456A90')
      .setNationality('ZW')
      .setAddress('123 Main Street, Harare');
    
    const response = await client.registerCustomer(customer);
    console.log('Customer Registration Response:', response.getStatusCode(), response.getBodyAsJson());
  } catch (error) {
    console.error('Customer Registration Error:', error);
  }
}

// Example C2B Push Payment
async function testC2BPush() {
  try {
    const params = {
      transOrderNo: Date.now().toString(),
      amt: 100,
      currency: 'ZWG',
      mobileNo: '710939852',
      goodsName: 'Test Product howzit'
      
    };
    
    const response = await client.c2bPushPayment(params);
    console.log('C2B Push Response:', response.getStatusCode(), response.getBodyAsJson());
  } catch (error) {
    console.error('C2B Push Error:', error);
  }
}

// Example C2B Query
async function testC2BQuery() {
  try {
    const transOrderNo = '1732618067884'; // Replace with actual order no
    const response = await client.c2bQuery(transOrderNo);
    console.log('C2B Query Response:', response.getStatusCode(), response.getBodyAsJson());
  } catch (error) {
    console.error('C2B Query Error:', error);
  }
}

// Example B2C Payment
async function testB2CPayment() {
  try {
    const params = {
      transOrderNo: Date.now().toString(),
      orderAmt: 50,
      currency: 'ZWG',
      recCstMobile: '712984123',
      businessType: '1',
      remark: 'Salary Payment'
    };
    
    const response = await client.b2cPayment(params);
    console.log('B2C Payment Response:', response.getStatusCode(), response.getBodyAsJson());
  } catch (error) {
    console.error('B2C Payment Error:', error);
  }
}

// Run examples (matches Java Main.java pattern)
(async () => {
  console.log('Testing OneMoney Integration - Node.js Client');
  console.log('Encrypted Credential:', thirdPartyCredential);
  
  // Test customer registration first (like Java implementation)
  // await testCustomerRegistration();
  
  // Test payment operations
  await testC2BPush();
  // await testC2BQuery();
  // await testB2CPayment();
})();