class PaymentResponse {
  constructor(data) {
    this.transOrderNo = data.transOrderNo;
    this.orderNo = data.orderNo;
    this.orderAmt = data.orderAmt;
    this.currency = data.currency;
    this.actAmt = data.actAmt;
    this.feeAmt = data.feeAmt;
    this.taxAmt = data.taxAmt;
    this.orderStatus = data.orderStatus;
    this.statusDescription = data.statusDescription;
    this.signatureValid = data.signatureValid;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  // Get status description based on order status
  static getStatusDescription(orderStatus) {
    const statusMap = {
      '0': 'Payment Pending',
      '1': 'Payment Successful', 
      '2': 'Payment Failed',
      '3': 'Payment Cancelled',
      '4': 'Payment Processing',
      '5': 'Payment Expired'
    };
    return statusMap[orderStatus] || 'Unknown Status';
  }

  // Check if payment is successful
  isSuccessful() {
    return this.orderStatus === '1';
  }

  // Check if payment is pending
  isPending() {
    return this.orderStatus === '0' || this.orderStatus === '4';
  }

  // Check if payment is failed
  isFailed() {
    return this.orderStatus === '2' || this.orderStatus === '3' || this.orderStatus === '5';
  }

  // Convert to JSON for API response
  toJSON() {
    return {
      transOrderNo: this.transOrderNo,
      orderNo: this.orderNo,
      orderAmt: this.orderAmt,
      currency: this.currency,
      actAmt: this.actAmt,
      feeAmt: this.feeAmt,
      taxAmt: this.taxAmt,
      orderStatus: this.orderStatus,
      statusDescription: this.statusDescription,
      signatureValid: this.signatureValid,
      timestamp: this.timestamp,
      isSuccessful: this.isSuccessful(),
      isPending: this.isPending(),
      isFailed: this.isFailed()
    };
  }

  // Create from decrypted OneMoney response
  static fromOneMoneyResponse(transaction, signatureValid = false) {
    return new PaymentResponse({
      transOrderNo: transaction.transOrderNo,
      orderNo: transaction.orderNo,
      orderAmt: transaction.orderAmt,
      currency: transaction.currency,
      actAmt: transaction.actAmt,
      feeAmt: transaction.feeAmt,
      taxAmt: transaction.taxAmt,
      orderStatus: transaction.orderStatus,
      statusDescription: PaymentResponse.getStatusDescription(transaction.orderStatus),
      signatureValid: signatureValid
    });
  }
}

module.exports = PaymentResponse;