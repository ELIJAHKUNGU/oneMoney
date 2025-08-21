/**
 * OneMoney Customer - matches Java OneMoneyCustomer POJO
 */
class OneMoneyCustomer {
  constructor() {
    this.mobile = null;
    this.dateOfBirth = null; // Format ddMMyyyy
    this.gender = null; // 2: Male, 1: Female
    this.firstName = null;
    this.lastName = null;
    this.email = null;
    this.address = null;
    this.idType = null;
    this.idNumber = null;
    this.nationality = null;
    this.cityCode = null;
    this.idExpiringDate = null; // Format ddMMyyyy
    this.idEffectiveDate = null; // Format ddMMyyyy
    this.identifierType = null;
    this.identifier = null;
    this.securityCredential = null;
    
    // ID Pictures
    this.customerIdentificationPhotoOne = null;
    this.customerIdentificationPhotoTwo = null;
    this.customerIdentificationPhotoThree = null;
    
    // Face Pictures
    this.customerFacialPhotoOne = null;
    this.customerFacialPhotoTwo = null;
    this.customerFacialPhotoThree = null;
    
    // Customer Signature
    this.customerSignsAgreement = null;
    
    this.timestamp = Math.floor(Date.now() / 1000) + "000";
    this.random = Math.floor(Date.now() / 1000) + "000";
  }

  // Fluent setters
  setMobile(mobile) {
    this.mobile = mobile;
    return this;
  }

  setDateOfBirth(dateOfBirth) {
    this.dateOfBirth = dateOfBirth;
    return this;
  }

  setGender(gender) {
    this.gender = gender;
    return this;
  }

  setFirstName(firstName) {
    this.firstName = firstName;
    return this;
  }

  setLastName(lastName) {
    this.lastName = lastName;
    return this;
  }

  setEmail(email) {
    this.email = email;
    return this;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  setIdType(idType) {
    this.idType = idType;
    return this;
  }

  setIdNumber(idNumber) {
    this.idNumber = idNumber;
    return this;
  }

  setNationality(nationality) {
    this.nationality = nationality;
    return this;
  }

  setCityCode(cityCode) {
    this.cityCode = cityCode;
    return this;
  }

  setIdExpiringDate(idExpiringDate) {
    this.idExpiringDate = idExpiringDate;
    return this;
  }

  setIdEffectiveDate(idEffectiveDate) {
    this.idEffectiveDate = idEffectiveDate;
    return this;
  }

  setIdentifierType(identifierType) {
    this.identifierType = identifierType;
    return this;
  }

  setIdentifier(identifier) {
    this.identifier = identifier;
    return this;
  }

  setSecurityCredential(securityCredential) {
    this.securityCredential = securityCredential;
    return this;
  }

  setCustomerIdentificationPhotoOne(photo) {
    this.customerIdentificationPhotoOne = photo;
    return this;
  }

  setCustomerIdentificationPhotoTwo(photo) {
    this.customerIdentificationPhotoTwo = photo;
    return this;
  }

  setCustomerIdentificationPhotoThree(photo) {
    this.customerIdentificationPhotoThree = photo;
    return this;
  }

  setCustomerFacialPhotoOne(photo) {
    this.customerFacialPhotoOne = photo;
    return this;
  }

  setCustomerFacialPhotoTwo(photo) {
    this.customerFacialPhotoTwo = photo;
    return this;
  }

  setCustomerFacialPhotoThree(photo) {
    this.customerFacialPhotoThree = photo;
    return this;
  }

  setCustomerSignsAgreement(agreement) {
    this.customerSignsAgreement = agreement;
    return this;
  }
}

module.exports = OneMoneyCustomer;