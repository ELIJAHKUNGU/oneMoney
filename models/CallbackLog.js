const mongoose = require('mongoose');

const callbackLogSchema = new mongoose.Schema({
  // Transaction reference
  transOrderNo: {
    type: String,
    required: true,
    index: true
  },
  orderNo: {
    type: String,
    index: true
  },
  
  // Callback metadata
  callbackType: {
    type: String,
    enum: ['payment_notification', 'status_update', 'webhook', 'other'],
    default: 'payment_notification'
  },
  source: {
    type: String,
    default: 'onemoney',
    index: true
  },
  
  // HTTP request details
  httpMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    default: 'POST'
  },
  requestUrl: {
    type: String
  },
  requestHeaders: {
    type: mongoose.Schema.Types.Mixed
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Raw callback data
  rawPayload: {
    type: String // JSON string of the raw request
  },
  
  // Decrypted/processed data
  processedData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Encryption/Security details
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionDetails: {
    encryptKeyId: String,
    signaturePresent: Boolean,
    signatureValid: Boolean,
    decryptionSuccess: Boolean,
    decryptionError: String
  },
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['received', 'processing', 'processed', 'failed', 'ignored'],
    default: 'received'
  },
  processingError: {
    type: String
  },
  processingNotes: {
    type: String
  },
  
  // Response details
  responseStatus: {
    type: Number,
    default: 200
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed
  },
  responseSentAt: {
    type: Date
  },
  
  // Client information
  clientIp: {
    type: String,
    index: true
  },
  userAgent: {
    type: String
  },
  
  // Timing information
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  processingDuration: {
    type: Number // in milliseconds
  },
  
  // Related transaction
  transactionFound: {
    type: Boolean,
    default: false
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OneTransaction'
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'callbacklogs'
});

// Indexes for better query performance
callbackLogSchema.index({ receivedAt: -1 });
callbackLogSchema.index({ processingStatus: 1 });
callbackLogSchema.index({ callbackType: 1 });
callbackLogSchema.index({ source: 1, receivedAt: -1 });
callbackLogSchema.index({ clientIp: 1 });

// Update processing information
callbackLogSchema.pre('save', function(next) {
  // Calculate processing duration if both timestamps are available
  if (this.receivedAt && this.processedAt) {
    this.processingDuration = this.processedAt.getTime() - this.receivedAt.getTime();
  }
  
  next();
});

// Instance methods
callbackLogSchema.methods.markAsProcessed = function(processedData, notes = null) {
  this.processingStatus = 'processed';
  this.processedAt = new Date();
  this.processingNotes = notes;
  
  if (processedData) {
    this.processedData = processedData;
  }
  
  return this.save();
};

callbackLogSchema.methods.markAsFailed = function(error, notes = null) {
  this.processingStatus = 'failed';
  this.processedAt = new Date();
  this.processingError = error.message || error.toString();
  this.processingNotes = notes;
  
  return this.save();
};

callbackLogSchema.methods.setResponse = function(statusCode, responseBody) {
  this.responseStatus = statusCode;
  this.responseBody = responseBody;
  this.responseSentAt = new Date();
  
  return this.save();
};

callbackLogSchema.methods.linkTransaction = function(transactionId) {
  this.transactionFound = true;
  this.transactionId = transactionId;
  
  return this.save();
};

// Static methods
callbackLogSchema.statics.findByTransOrderNo = function(transOrderNo) {
  return this.find({ transOrderNo }).sort({ receivedAt: -1 });
};

callbackLogSchema.statics.findRecentCallbacks = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ receivedAt: { $gte: since } }).sort({ receivedAt: -1 });
};

callbackLogSchema.statics.findFailedCallbacks = function() {
  return this.find({ processingStatus: 'failed' }).sort({ receivedAt: -1 });
};

callbackLogSchema.statics.getCallbackStats = function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.receivedAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          status: '$processingStatus',
          source: '$source',
          type: '$callbackType'
        },
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingDuration' },
        maxProcessingTime: { $max: '$processingDuration' },
        minProcessingTime: { $min: '$processingDuration' }
      }
    },
    {
      $project: {
        processingStatus: '$_id.status',
        source: '$_id.source',
        callbackType: '$_id.type',
        count: 1,
        avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
        maxProcessingTime: 1,
        minProcessingTime: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

callbackLogSchema.statics.createFromRequest = function(req, transOrderNo, callbackType = 'payment_notification') {
  const clientIp = req.ip || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                  req.headers['x-forwarded-for'] ||
                  req.headers['x-real-ip'];

  return new this({
    transOrderNo,
    callbackType,
    httpMethod: req.method,
    requestUrl: req.originalUrl || req.url,
    requestHeaders: req.headers,
    requestBody: req.body,
    rawPayload: JSON.stringify(req.body),
    clientIp,
    userAgent: req.headers['user-agent'],
    receivedAt: new Date()
  });
};

const CallbackLog = mongoose.model('CallbackLog', callbackLogSchema);

module.exports = CallbackLog;