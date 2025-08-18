/**
 * Base Request Data Transfer Object - matches Java BaseReqDTO
 */
class BaseReqDTO {
  constructor() {
    this.timestamp = Math.floor(Date.now() / 1000) + "000"; // Instant.now().getEpochSecond() + "000"
    this.random = require('uuid').v4().replace(/-/g, ''); // UUID.randomUUID().toString()
    // this.language = "en";
    this.merNo = null;
    this.encryptData = null;
    this.encryptKeyId = null;
    this.signData = null;
    this.notifyUrl = null;

  }

  setMerNo(merNo) {
    this.merNo = merNo;
    return this;
  }

  setEncryptData(encryptData) {
    this.encryptData = encryptData;
    return this;
  }

  setEncryptKey(encryptKeyId) {
    this.encryptKeyId = encryptKeyId;
    return this;
  }

  setSignData(signData) {
    this.signData = signData;
    return this;
  }

  setLanguage(language) {
    this.language = language;
    return this;
  }
   setNotifyUrl(notifyUrl) {
    this.notifyUrl = notifyUrl;
    return this;
  }
}

module.exports = BaseReqDTO;