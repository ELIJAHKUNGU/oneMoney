class PaymentRequest {
  constructor(data) {
    this.mobileNo = data.mobileNo;
    this.currency = data.currency;
    this.orderAmt = data.orderAmt;
    this.goodsName = data.goodsName || "Howzit Payment";
    this.transOrderNo = data.transOrderNo || Date.now().toString();
    this.notifyUrl = data.notifyUrl;
  }

  // Validate payment request data
  validate() {
    const errors = [];

    if (!this.mobileNo) {
      errors.push('Mobile number is required');
    } else if (!/^\d{9,15}$/.test(this.mobileNo)) {
      errors.push('Mobile number must be between 9 and 15 digits');
    }

    if (!this.currency) {
      errors.push('Currency is required');
    } else if (!['ZWG', 'USD', 'ZAR'].includes(this.currency.toUpperCase())) {
      errors.push('Currency must be ZWG, USD, or ZAR');
    }

    if (!this.orderAmt) {
      errors.push('Order amount is required');
    } else if (isNaN(this.orderAmt) || parseFloat(this.orderAmt) <= 0) {
      errors.push('Order amount must be a positive number');
    }

    if (this.goodsName && this.goodsName.length > 100) {
      errors.push('Goods name cannot exceed 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to JSON for API request
  toJSON() {
    return {
      transOrderNo: this.transOrderNo,
      orderAmt: parseFloat(this.orderAmt),
      currency: this.currency.toUpperCase(),
      mobileNo: this.mobileNo,
      goodsName: this.goodsName,
      notifyUrl: this.notifyUrl
    };
  }

  // Create from request body
  static fromRequestBody(body) {
    return new PaymentRequest({
      mobileNo: body.mobileNo,
      currency: body.currency,
      orderAmt: body.orderAmt,
      goodsName: body.goodsName,
      transOrderNo: body.transOrderNo,
      notifyUrl: body.notifyUrl
    });
  }
}

module.exports = PaymentRequest;