const forge = require("node-forge");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const axios = require('axios');

// Replace with your RSA keys
const ONEMONEY_PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzT00cO3c0GKpFSRA2JTfYKiPfwthrG3Q1PRaOEm1rdBkGWEL3120Ukh/OBRPpzSJHgffyivWtdxUIREEFehdARG3Ru/nhehmPbzODLInVUXib6VTmyc+o9NssQwzuqyXtHCpFOAcZUyIliI12MREz3pWRFdU9vutPE7egBdiInzRdm5hC1z809Q/OA4HkosQqpvHF24Tmjfvj97gUY/zwrX0dY5PRsIlJjuV1K5zhXu3TDYbbC8Nyclmbsk1AYGS9kQKtJsYWaN4zIM8svz5IGT8Mg/FTARGKyhSXDR0lJ3ZvLYdvrVNu1XD5/OR6m+9Z1BbWeYPwXK5tGe9LEH2nQIDAQAB
-----END PUBLIC KEY-----
`;

// Your private key for decryption
const HOWZIT_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAuNiac4lHvaf7u1c+hGmVuFPeY6yNUStDB9CqS+LqafsMxqrYFVpnQ1Zyjyz476SvYuW2z/OrTKI0xi2NbJIWIPEEn/Wk5MEFRNX5gGymkTtYsrtBaBy6Y3ItNUn01DmkErFiUlS6RQoi920GTmgcJtcjYqyrfQ5N5wQutX+R80GEKWrIZgXkUtldFZN2rOQW3e68TfXTV3yUZ9/c1sbcTCSde5JleqIrjVT+066VY/uIU5pa5vR2w+Xd33C+R5Ai2Hf4Ah6wykgKQHg4EJF3RYJO3LoF1V0Yf/61rVztrvG8OcU2/9neGdp1wRK4mVrzzRl55c9YXVLmaSqHTxohCwIDAQABAoIBAQCRYnwIh18PwoHyFWqshscllYGC8AKuZtJv4SUwTqeE99pSn6kZEmPJyMKN7hdVlTgFFxw0bzi6K5JKlSV40WXqPuceUPyCl3Znb8yvv8U60WywFywYkQ/gi7sXALY5/aQYt7/XdaCUEKbz6KJfJO+PdQL1501yLMAFBXsfcdj/c6Anhja+jjwnPbkYqrEJyEm+Y2f3NmwsL5+Pj8sGnFrivKu0K9uXEznzhdArViQ0Wh47xarl6lPluMwZPfR/K7VUK++FPQoTmoSXiS9DHQGCq6ogmg1WUxK4ZkZxBKg5XojEo8oHkiQis0eB8BLHA4hrBV2V3MTcbzPcSjZo0w0hAoGBANpZpnYvnBeaCwRJukY82IrUIPPm+9sUWpUQ2xSyWAotjt9AXhmVVWUGvM/z8YYbrd+38tDFPhPjccSMTt8rD52C20ec0N9fG/bi7jEpDT8syTmim1LG1oQCLhAyabq+EXwUKsS12sDjD1EPnrzQ3ii9R1axHaEyyg02U0ouq8YTAoGBANi4BoW9kKdROgR+eOvWwR9R0kfZEEMfkG6xBg9rKwBpQzLebGiROVd49TIyHsgXUBRPjJu0fAWHASgVtQdDrSB8jXama88NKhujovbmqTI1Po6TXayWrHBgzluQNfi22rKJuVMNp0oB0wyCsPAi7L1SZui8HgUdBomecXkWF/gpAoGAVBsMP6H/Iig37iLoGX3+extSxiBHCxBABANGICbCOslpqx0EIh6fkhaSTBfPBLVMuEwGv9v6GXcWr3rMNrJDhYyOInuJCUF9aA/paA5EB/2cVRMJeU0V/CtKyvpgN4pW+dBa2QKjjIDpuXOm1Vwu9spR3FbE7v69TXGLi5uGlvkCgYEAoBpTtzn0Q6eeVPOaIaDly12HG80gVnZbHWtqLrndatBY9JudOyMOWbDic9LTKr8OSfL6zYzokqzKDfL7agJ1RCq/14fa3Xu8P+8D1aNSG+V58Zqs+XPWsK7TxJElTjjIGF3mq5TKocH3SKbEUKN8geD+ZbGT+/MVgVWsPugzjQECgYEAmcIFuyK9AJPUMQdAEce2uhJYl944FqPdVL5kjwCcazDGb777VcbeFj6QzHyyf5WWFk2ByC65mG6cs9jD0Mys3Ko5nJEyxXaNwOEHPILrTkI46Osk7OeXsHpPFbUtT4J0IkUWYJzAFtTIVi4J3B8VDHHCpBqDWX5IKdE+NT0A0GY=
-----END RSA PRIVATE KEY-----
`;

// RSA Decrypt (private key)
function decryptSecretKey(encryptedKey, privateKey) {
  // Double base64 decode
  const base64Once = Buffer.from(encryptedKey, "base64").toString("utf8");
  const encryptedBuffer = Buffer.from(base64Once, "base64");
  
  const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
  
  const decryptedBytes = privateKeyObj.decrypt(encryptedBuffer.toString("binary"), "RSAES-PKCS1-V1_5");
  
  return decryptedBytes;
}

// AES Decrypt
function decryptPayload(encryptedData, secretKey) {
  // Double base64 decode
  const base64Once = Buffer.from(encryptedData, "base64").toString("utf8");
  const ciphertext = base64Once;
  
  const keyWordArray = CryptoJS.enc.Utf8.parse(secretKey);
  
  const decrypted = CryptoJS.AES.decrypt(ciphertext, keyWordArray, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// SHA-256 Verify
function verifyWithSha256(originalData, signatureToVerify) {
  const hash = crypto.createHash("sha256").update(originalData, "utf8").digest("hex");
  return hash.toLowerCase() === signatureToVerify.toLowerCase();
}

// Complete decrypt message function
function decryptMessage(response, privateKey) {
  try {
    // Step 1: RSA Decrypt to get secret key
    const secretKey = decryptSecretKey(response.encryptKey, privateKey);
    console.log("Decrypted Secret Key:", secretKey);
    
    // Step 2: AES Decrypt to get original data
    const decryptedData = decryptPayload(response.encryptData, secretKey);
    console.log("Decrypted Data:", decryptedData);
    
    // Step 3: Verify signature
    const isValid = verifyWithSha256(decryptedData, response.signData);
    console.log("Signature Valid:", isValid);
    
    return {
      secretKey,
      decryptedData,
      isValid,
      originalPayload: JSON.parse(decryptedData)
    };
  } catch (error) {
    console.error("Decryption Error:", error);
    return null;
  }
}

// AES Encrypt
function encryptPayload(payload, secretKey) {
  const keyWordArray = CryptoJS.enc.Utf8.parse(secretKey);

  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(payload), keyWordArray, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });

  const base64Once = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

  const finalResult = Buffer.from(base64Once, "utf8").toString("base64");

  return finalResult;
}

// RSA Encrypt (public key)
function encryptSecretKey(secretKey) {
  const publicKey = forge.pki.publicKeyFromPem(ONEMONEY_PUBLIC_KEY);

  const encryptedBytes = publicKey.encrypt(secretKey, "RSAES-PKCS1-V1_5");

  const encryptedBuffer = Buffer.from(encryptedBytes, "binary");

  const base64Once = encryptedBuffer.toString("base64");

  const finalResult = Buffer.from(base64Once, "utf8").toString("base64");

  return finalResult;
}

// SHA-256 Sign
function signWithSha256(content) {
  const hash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
  return hash.toLowerCase();
}

// --- Example usage ---
const TIMESTAMP = Date.now();
const jsonPayload1 = JSON.stringify({
  transOrderNo: Date.now().toString(),
  orderAmt: 2,
  currency: "ZWG",
  mobileNo: "712980059",
  goodsName: "Wallet On POS",
  notifyUrl: "http://10.44.16.51:8762/responsereceiver/TransactionResultService",
});

const secretKey = "mysampleaeskey16"; // must be 16 chars (128-bit)


// Encrypt
const encryptData = encryptPayload(jsonPayload1, secretKey);
const encryptKey = encryptSecretKey(secretKey);
const signData = signWithSha256(jsonPayload1);

console.log("Encrypted:", { encryptData, encryptKey, signData });

// Build structured object
const payload = {
  timestamp: TIMESTAMP,
  random: TIMESTAMP, // or use a UUID if required
  encryptKeyId: "6c12e964cd59",
  merNo: "1883151315996622850",
  encryptData,
  encryptKey,
  signData,
};



// Pretty-print JSON (with escaped quotes if needed)
console.log(JSON.stringify(JSON.stringify(payload)))

async function testC2BPush() {
  try {
    const endpoint = 'http://172.28.255.24:8087/api/pay/payment/push'
    
    const response = await axios.post(`${endpoint}`, payload);
    console.log('C2B Push Response:', response?.data);
    
    // Test decryption if we get a response
    if (response?.data) {
      console.log('\n--- Testing Decryption ---');
      const decryptResult = decryptMessage(response.data, HOWZIT_PRIVATE_KEY);
      if (decryptResult) {
        console.log('Decryption successful:', decryptResult);
      }
    }
  } catch (error) {
    console.error('C2B Push Error:', error);
  }
}



// Test complete decryption with transaction data
function testCompleteDecryption() {
  console.log('\n=== COMPLETE DECRYPTION TEST ===');
  
  // Create a sample transaction response (what OneMoney would send back)
  const sampleTransactionData = JSON.stringify({
    transOrderNo: "1035770533xby",
    orderNo: "OM20241221001", 
    orderAmt: 100.50,
    currency: "ZWG",
    actAmt: 98.75,
    feeAmt: 1.75,
    taxAmt: 0.00,
    orderStatus: "30", // 30 = Success
    timestamp: Date.now()
  });
  
  console.log('📋 Sample Transaction Data to Encrypt:', sampleTransactionData);
  console.log();
  
  // Use the key we decrypted earlier
  const testSecretKey = "arl6k8dza25aix0j"; 
  
  try {
    // Encrypt the transaction data
    const encryptedData = encryptPayload(sampleTransactionData, testSecretKey);
    const signature = signWithSha256(sampleTransactionData);
    
    console.log('🔒 Encrypted transaction data created');
    
    // Now test the complete decryption with full response object
    const testResponse = {
      encryptData: encryptedData,
      encryptKey: 'RUZaSVNCRjdaQnNYNithYlVuckVtbiswZm9LT0NrZEExTTFwQkNqaEVCdkx2VUU4dkxkdDdUS1lRSnhycUFYSFQ4SGdTdnh5UE1tRVpwY1pmMWxILzQ1bCtHK1ZRbnZBcGNma1B6VEFYNWorUm1rYzA1a0MwQk53aVZ1UWkwUGhkVnZ4MjhkTFFjSFdqUEk1bnZFOEM2eG5JZ2Z3RXRLOUExQmlXZUJyTmlJYUtNUGt6VnYwbjlnOUpuVHRMSFI0WmRFUCtVTHJiWXA0U0VZZDNBVElCWDJoeWxTWXlCcWIrWWYvVExSM2ZZUjdvdkxMRlVWbFVPYkJjRnV5ZWpLYktLNWxCbkViS0dCSFk0R2xBSCs1cHhuQi8vWXJaY2JSRE1mTHdPQjg3TjZWNTh3VjBGUEFCQzVhS1Z2ZU9QODhGc0dxSUlWSUtJZlN4WWcvVTI5dmlnPT0=',
      signData: signature
    };
    
    console.log('🔓 DECRYPTING COMPLETE MESSAGE...\n');
    
    // Use the complete decryptMessage function
    const result = decryptMessage(testResponse, HOWZIT_PRIVATE_KEY);
    
    if (result && result.originalPayload) {
      const transaction = result.originalPayload;
      
      console.log('\n🎉 FINAL DECRYPTED TRANSACTION MESSAGE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Transaction Order No:', transaction.transOrderNo);
      console.log('📋 Order Number:', transaction.orderNo);
      console.log('💰 Order Amount:', transaction.orderAmt, transaction.currency);
      console.log('💰 Actual Amount:', transaction.actAmt, transaction.currency);
      console.log('💰 Fee Amount:', transaction.feeAmt, transaction.currency);
      console.log('💰 Tax Amount:', transaction.taxAmt, transaction.currency);
      console.log('📊 Order Status:', transaction.orderStatus, getStatusDescription(transaction.orderStatus));
      console.log('⏰ Timestamp:', new Date(transaction.timestamp).toLocaleString());
      console.log('✅ Signature Valid:', result.isValid);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return transaction;
    } else {
      console.log('❌ Failed to decrypt transaction message');
      return null;
    }
    
  } catch (error) {
    console.error('❌ DECRYPTION FAILED:', error.message);
    return null;
  }
}

// Helper function to describe order status
function getStatusDescription(status) {
  const statusMap = {
    '10': 'Initialization',
    '20': 'Payment in progress', 
    '30': 'Success',
    '40': 'Failure',
    '50': 'Order closed'
  };
  return statusMap[status] || 'Unknown status';
}

(async () => {
  console.log('Testing OneMoney Integration - Node.js Client');
  
 testCompleteDecryption()
  
  // Test payment operations
  // await testC2BPush();
  // await testC2BQuery();
  // await testB2CPayment();
})();