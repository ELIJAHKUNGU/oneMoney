const forge = require("node-forge");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

class CryptoService {
  constructor(oneMoneyPublicKey, howzitPrivateKey) {
    this.oneMoneyPublicKey = oneMoneyPublicKey;
    this.howzitPrivateKey = howzitPrivateKey;
  }

  // RSA Decrypt (private key)
  decryptSecretKey(encryptedKey, privateKey) {
    // Double base64 decode
    const base64Once = Buffer.from(encryptedKey, "base64").toString("utf8");
    const encryptedBuffer = Buffer.from(base64Once, "base64");
    
    const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
    
    const decryptedBytes = privateKeyObj.decrypt(encryptedBuffer.toString("binary"), "RSAES-PKCS1-V1_5");
    
    return decryptedBytes;
  }

  // AES Decrypt
  decryptPayload(encryptedData, secretKey) {
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
  verifyWithSha256(originalData, signatureToVerify) {
    const hash = crypto.createHash("sha256").update(originalData, "utf8").digest("hex");
    return hash.toLowerCase() === signatureToVerify.toLowerCase();
  }

  // Complete decrypt message function
  decryptMessage(response, privateKey) {
    try {
      // Step 1: RSA Decrypt to get secret key
      const secretKey = this.decryptSecretKey(response.encryptKey, privateKey);
      console.log("Decrypted Secret Key:", secretKey);
      
      // Step 2: AES Decrypt to get original data
      const decryptedData = this.decryptPayload(response.encryptData, secretKey);
      console.log("Decrypted Data:", decryptedData);
      
      // Step 3: Verify signature
      const isValid = this.verifyWithSha256(decryptedData, response.signData);
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
  encryptPayload(payload, secretKey) {
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
  encryptSecretKey(secretKey) {
    const publicKey = forge.pki.publicKeyFromPem(this.oneMoneyPublicKey);

    const encryptedBytes = publicKey.encrypt(secretKey, "RSAES-PKCS1-V1_5");

    const encryptedBuffer = Buffer.from(encryptedBytes, "binary");

    const base64Once = encryptedBuffer.toString("base64");

    const finalResult = Buffer.from(base64Once, "utf8").toString("base64");

    return finalResult;
  }

  // SHA-256 Sign
  signWithSha256(content) {
    const hash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
    return hash.toLowerCase();
  }
}

module.exports = CryptoService;