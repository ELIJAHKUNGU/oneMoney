class EncryptedPayload {
  constructor(data) {
    this.timestamp = data.timestamp || Date.now();
    this.random = data.random || this.timestamp;
    this.encryptKeyId = data.encryptKeyId;
    this.merNo = data.merNo;
    this.encryptData = data.encryptData;
    this.encryptKey = data.encryptKey;
    this.signData = data.signData;
  }

  // Validate encrypted payload
  validate() {
    const errors = [];

    if (!this.encryptKeyId) {
      errors.push('Encrypt key ID is required');
    }

    if (!this.merNo) {
      errors.push('Merchant number is required');
    }

    if (!this.encryptData) {
      errors.push('Encrypted data is required');
    }

    if (!this.encryptKey) {
      errors.push('Encrypted key is required');
    }

    if (!this.signData) {
      errors.push('Signature data is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to JSON for API request
  toJSON() {
    return {
      timestamp: this.timestamp,
      random: this.random,
      encryptKeyId: this.encryptKeyId,
      merNo: this.merNo,
      encryptData: this.encryptData,
      encryptKey: this.encryptKey,
      signData: this.signData
    };
  }

  // Create encrypted payload from payment data
  static create(encryptedData, encryptedKey, signature, config) {
    return new EncryptedPayload({
      encryptKeyId: config.encryptKeyId,
      merNo: config.merNo,
      encryptData: encryptedData,
      encryptKey: encryptedKey,
      signData: signature
    });
  }
}

module.exports = EncryptedPayload;