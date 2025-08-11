const crypto = require('crypto');
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


  // Generate random AES key (256-bit)
  generateAesKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  // AES encrypt data
  aesEncrypt(data, key) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return {
        iv: iv.toString('base64'),
        encryptedData: encrypted
      };
    } catch (error) {
      console.error('AES Encryption Error:', error);
      throw error;
    }
  }

  // AES decrypt data
  aesDecrypt(encryptedData, key, iv) {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        Buffer.from(key, 'base64'), 
        Buffer.from(iv, 'base64')
      );
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('AES Decryption Error:', error);
      throw error;
    }
  }

  // RSA encrypt with OneMoney public key
  rsaEncrypt(data) {
    try {
      return this.oneMoneyPublicKey.encrypt(data, 'base64');
    } catch (error) {
      console.error('RSA Encryption Error:', error);
      throw error;
    }
  }

  // RSA decrypt with our private key
  rsaDecrypt(encryptedData) {
    try {
      return this.privateKey.decrypt(encryptedData, 'utf8');
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

  // Generate timestamp and random string for requests
  generateRequestMeta() {
    return {
      timestamp: Date.now(),
      random: uuidv4()
    };
  }
}

module.exports = EncryptionUtil;