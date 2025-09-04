const mongoose = require('mongoose');

const oneTransactionSchema = new mongoose.Schema({
  // Transaction identifiers
  transOrderNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderNo: {
    type: String,
    index: true
  },
  
  // Payment details
  mobileNo: {
    type: String,
    required: true
  },
  orderAmt: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['ZWG', 'USD', 'ZAR']
  },
  goodsName: {
    type: String,
    required: true
  },
  
  // Actual transaction amounts (from response)
  actAmt: {
    type: Number
  },
  feeAmt: {
    type: Number,
    default: 0
  },
  taxAmt: {
    type: Number,
    default: 0
  },
  
  // Status tracking
  orderStatus: {
    type: String,
    enum: ['0', '1', '2', '3', '4', '5'], // 0=pending, 1=success, 2=failed, 3=cancelled, 4=processing, 5=expired
    default: '0'
  },
  statusDescription: {
    type: String,
    default: 'Payment Pending'
  },
  
  // Request payload (encrypted)
  requestPayload: {
    originalPayload: String, // JSON string of original request
    encryptedPayload: {
      timestamp: Number,
      random: Number,
      encryptKeyId: String,
      merNo: String,
      encryptData: String,
      encryptKey: String,
      signData: String
    }
  },
  
  // Response from OneMoney API
  apiResponse: {
    status: String,
    code: String,
    success: Boolean,
    message: String,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  
  // Callback data
  callbackReceived: {
    type: Boolean,
    default: false
  },
  callbackData: {
    type: mongoose.Schema.Types.Mixed
  },
  callbackReceivedAt: {
    type: Date
  },
  
  // Signature verification
  signatureValid: {
    type: Boolean
  },
  
  // Additional metadata
  notifyUrl: String,
  ipAddress: String,
  userAgent: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'onetransactions'
});

// Indexes for better query performance
oneTransactionSchema.index({ createdAt: -1 });
oneTransactionSchema.index({ orderStatus: 1 });
oneTransactionSchema.index({ mobileNo: 1 });
oneTransactionSchema.index({ currency: 1 });

// Update the updatedAt field on save
oneTransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set completedAt when status changes to success or failed
  if (this.isModified('orderStatus') && ['1', '2'].includes(this.orderStatus)) {
    this.completedAt = Date.now();
  }
  
  next();
});

// Instance methods
oneTransactionSchema.methods.updateStatus = function(newStatus, description) {
  this.orderStatus = newStatus;
  this.statusDescription = description || this.getStatusDescription(newStatus);
  
  if (['1', '2'].includes(newStatus)) {
    this.completedAt = Date.now();
  }
  
  return this.save();
};

oneTransactionSchema.methods.getStatusDescription = function(status = this.orderStatus) {
  const statusMap = {
    '0': 'Payment Pending',
    '1': 'Payment Successful',
    '2': 'Payment Failed',
    '3': 'Payment Cancelled',
    '4': 'Payment Processing',
    '5': 'Payment Expired'
  };
  return statusMap[status] || 'Unknown Status';
};

oneTransactionSchema.methods.updateFromCallback = function(callbackData, isSignatureValid = false) {
  this.callbackReceived = true;
  this.callbackData = callbackData;
  this.callbackReceivedAt = Date.now();
  this.signatureValid = isSignatureValid;
  
  // Update transaction details from callback if available
  if (callbackData.orderNo) this.orderNo = callbackData.orderNo;
  if (callbackData.orderStatus) this.orderStatus = callbackData.orderStatus;
  if (callbackData.actAmt) this.actAmt = callbackData.actAmt;
  if (callbackData.feeAmt) this.feeAmt = callbackData.feeAmt;
  if (callbackData.taxAmt) this.taxAmt = callbackData.taxAmt;
  
  this.statusDescription = this.getStatusDescription(this.orderStatus);
  
  return this.save();
};

// Static methods
oneTransactionSchema.statics.findByTransOrderNo = function(transOrderNo) {
  return this.findOne({ transOrderNo });
};

oneTransactionSchema.statics.findByStatus = function(status) {
  return this.find({ orderStatus: status });
};

oneTransactionSchema.statics.findPendingTransactions = function() {
  return this.find({ orderStatus: { $in: ['0', '4'] } }); // pending or processing
};

oneTransactionSchema.statics.getTransactionSummary = function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$orderAmt' },
        totalActualAmount: { $sum: '$actAmt' },
        totalFees: { $sum: '$feeAmt' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        totalAmount: 1,
        totalActualAmount: 1,
        totalFees: 1,
        statusDescription: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', '0'] }, then: 'Pending' },
              { case: { $eq: ['$_id', '1'] }, then: 'Successful' },
              { case: { $eq: ['$_id', '2'] }, then: 'Failed' },
              { case: { $eq: ['$_id', '3'] }, then: 'Cancelled' },
              { case: { $eq: ['$_id', '4'] }, then: 'Processing' },
              { case: { $eq: ['$_id', '5'] }, then: 'Expired' }
            ],
            default: 'Unknown'
          }
        }
      }
    }
  ]);
};

const OneTransaction = mongoose.model('OneTransaction', oneTransactionSchema);

module.exports = OneTransaction;