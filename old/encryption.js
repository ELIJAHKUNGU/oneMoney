const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const NodeRSA = require('node-rsa');
const { v4: uuidv4 } = require('uuid');

class EncryptionUtil {
  constructor(privateKey, oneMoneyPublicKey) {
    try {
      this.privateKey = new NodeRSA();
      this.privateKey.importKey(privateKey, 'pkcs1-private-pem'); // ✅ correct type for your key

      this.oneMoneyPublicKey = new NodeRSA();
      this.oneMoneyPublicKey.importKey(oneMoneyPublicKey, 'pkcs8-public-pem'); // ✅ your public key is fine

      this.privateKey.setOptions({ encryptionScheme: 'pkcs1' });
      this.oneMoneyPublicKey.setOptions({ encryptionScheme: 'pkcs1' });
    } catch (error) {
      console.error('Key initialization error:', error);
      throw new Error('Failed to initialize encryption keys');
    }
  }


  // Generate random AES key (128-bit for OneMoney)
  generateAesKey() {
    return crypto.randomBytes(16).toString('base64'); // 128-bit = 16 bytes
  }

  // AES encrypt data using ECB mode as required by OneMoney (matches Java implementation)
  aesEncrypt(data, key) {
    try {
      // Convert base64 key to crypto-js format
      const keyWordArray = CryptoJS.enc.Base64.parse(key);
      
      // Encrypt using AES ECB mode with PKCS7 padding
      const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Match Java double Base64 encoding: base64Encoder.encodeToString(payload.getBytes(StandardCharsets.UTF_8))
      const encryptedBase64 = encrypted.toString();
      return Buffer.from(encryptedBase64, 'utf8').toString('base64');
    } catch (error) {
      console.error('AES Encryption Error:', error);
      throw error;
    }
  }

  // AES decrypt data using ECB mode (matches Java implementation)
  aesDecrypt(encryptedData, key) {
    try {
      // Convert base64 key to crypto-js format
      const keyWordArray = CryptoJS.enc.Base64.parse(key);
      
      // Handle double Base64 decoding to match Java implementation
      const decodedData = Buffer.from(encryptedData, 'base64').toString('utf8');
      const cleanedData = decodedData.replace(/\r\n/g, ''); // Match Java: payload.replaceAll("\r\n", "");
      
      // Decrypt using AES ECB mode with PKCS7 padding
      const decrypted = CryptoJS.AES.decrypt(cleanedData, keyWordArray, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('AES Decryption Error:', error);
      throw error;
    }
  }

  // RSA encrypt with OneMoney public key (matches Java double Base64 encoding)
  rsaEncrypt(data) {
    try {
      const encrypted = this.oneMoneyPublicKey.encrypt(data, 'base64');
      // Match Java double Base64 encoding: base64Encoder.encodeToString(secretKey.getBytes(StandardCharsets.UTF_8))
      return Buffer.from(encrypted, 'utf8').toString('base64');
    } catch (error) {
      console.error('RSA Encryption Error:', error);
      throw error;
    }
  }

  // RSA decrypt with our private key (matches Java implementation)
  rsaDecrypt(encryptedData) {
    try {
      // Handle double Base64 decoding to match Java implementation
      const decodedData = Buffer.from(encryptedData, 'base64').toString('utf8');
      return this.privateKey.decrypt(decodedData, 'utf8');
    } catch (error) {
      console.error('RSA Decryption Error:', error);
      throw error;
    }
  }

  // Generate SHA256 signature
  generateSignature(data) {
    try {
      return crypto.createHash('sha256')
        .update(typeof data === 'string' ? data : JSON.stringify(data))
        .digest('hex');
    } catch (error) {
      console.error('Signature Generation Error:', error);
      throw error;
    }
  }

  // Generate timestamp and random string for requests (matches Java BaseReqDTO)
  generateRequestMeta() {
    return {
      timestamp: Math.floor(Date.now() / 1000) + "000", // Match Java: Instant.now().getEpochSecond() + "000"
      random: uuidv4().replace(/-/g, '') // Remove dashes like Java UUID.randomUUID().toString()
    };
  }

  // Encrypt credentials using Triple DES (matches Java Cryptography.encryptCredential)
  static encryptCredential(credential) {
    try {
      // Use Node.js built-in crypto module for Triple DES (matches Java implementation exactly)
      const crypto = require('crypto');
      const keyString = "slrhxxsa9k2oqduntt4j9p1a";
      
      // Convert key to proper format for 3DES (24 bytes for Triple DES)
      const keyBytes = Buffer.from(keyString, 'utf8');
      
      // Create cipher using DES-EDE3-ECB (Triple DES ECB mode, matches Java TripleDES/ECB/PKCS5Padding)
      const cipher = crypto.createCipheriv('des-ede3-ecb', keyBytes, null);
      cipher.setAutoPadding(true); // PKCS5/PKCS7 padding
      
      let encrypted = cipher.update(credential, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      return encrypted;
    } catch (error) {
      console.error('Credential Encryption Error:', error);
      throw error;
    }
  }
}

module.exports = EncryptionUtil;