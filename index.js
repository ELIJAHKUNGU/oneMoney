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
  } catch (error) {
    console.error('C2B Push Error:', error);
  }
}

(async () => {
  console.log('Testing OneMoney Integration - Node.js Client');
  
  // Test customer registration first (like Java implementation)
  // await testCustomerRegistration();
  
  // Test payment operations
  await testC2BPush();
  // await testC2BQuery();
  // await testB2CPayment();
})();