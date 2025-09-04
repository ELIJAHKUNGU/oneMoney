const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  // Log level and category
  level: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug', 'trace'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'payment', 
      'callback', 
      'encryption', 
      'api', 
      'database', 
      'auth', 
      'validation', 
      'system',
      'external_api',
      'security'
    ],
    required: true,
    index: true
  },
  
  // Log content
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Context information
  module: {
    type: String, // e.g., 'PaymentService', 'paymentRoutes', etc.
  },
  function: {
    type: String // e.g., 'initiatePayment', 'processCallback', etc.
  },
  
  // Request context (if applicable)
  requestId: {
    type: String,
    index: true
  },
  transOrderNo: {
    type: String,
    index: true
  },
  userId: {
    type: String
  },
  sessionId: {
    type: String
  },
  
  // HTTP context (if applicable)
  httpMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  httpUrl: {
    type: String
  },
  httpStatus: {
    type: Number
  },
  
  // Client information
  clientIp: {
    type: String,
    index: true
  },
  userAgent: {
    type: String
  },
  
  // Error information (for error logs)
  error: {
    name: String,
    message: String,
    stack: String,
    code: String
  },
  
  // Performance metrics
  duration: {
    type: Number // in milliseconds
  },
  memoryUsage: {
    type: Number // in bytes
  },
  
  // Additional metadata
  tags: [{
    type: String,
    index: true
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Environment info
  environment: {
    type: String,
    default: process.env.NODE_ENV || 'development'
  },
  hostname: {
    type: String,
    default: require('os').hostname()
  },
  pid: {
    type: Number,
    default: process.pid
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'logs'
});

// Indexes for better query performance
logSchema.index({ timestamp: -1 }); // Most recent first
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });
logSchema.index({ module: 1, timestamp: -1 });
logSchema.index({ tags: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional - remove if you want to keep all logs)
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Instance methods
logSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this;
};

logSchema.methods.setError = function(error) {
  this.error = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code
  };
  return this;
};

logSchema.methods.setHttpContext = function(req, res) {
  this.httpMethod = req.method;
  this.httpUrl = req.originalUrl || req.url;
  
  if (res) {
    this.httpStatus = res.statusCode;
  }
  
  this.clientIp = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 req.headers['x-forwarded-for'] ||
                 req.headers['x-real-ip'];
                 
  this.userAgent = req.headers['user-agent'];
  
  return this;
};

// Static methods for creating logs
logSchema.statics.createError = function(message, error, context = {}) {
  const log = new this({
    level: 'error',
    category: context.category || 'system',
    message,
    module: context.module,
    function: context.function,
    requestId: context.requestId,
    transOrderNo: context.transOrderNo,
    details: context.details,
    tags: context.tags || []
  });
  
  if (error) {
    log.setError(error);
  }
  
  return log.save();
};

logSchema.statics.createWarning = function(message, context = {}) {
  return new this({
    level: 'warn',
    category: context.category || 'system',
    message,
    module: context.module,
    function: context.function,
    requestId: context.requestId,
    transOrderNo: context.transOrderNo,
    details: context.details,
    tags: context.tags || []
  }).save();
};

logSchema.statics.createInfo = function(message, context = {}) {
  return new this({
    level: 'info',
    category: context.category || 'system',
    message,
    module: context.module,
    function: context.function,
    requestId: context.requestId,
    transOrderNo: context.transOrderNo,
    details: context.details,
    tags: context.tags || []
  }).save();
};

logSchema.statics.createDebug = function(message, context = {}) {
  return new this({
    level: 'debug',
    category: context.category || 'system',
    message,
    module: context.module,
    function: context.function,
    requestId: context.requestId,
    transOrderNo: context.transOrderNo,
    details: context.details,
    tags: context.tags || []
  }).save();
};

// Query helpers
logSchema.statics.findByLevel = function(level, limit = 100) {
  return this.find({ level }).sort({ timestamp: -1 }).limit(limit);
};

logSchema.statics.findByCategory = function(category, limit = 100) {
  return this.find({ category }).sort({ timestamp: -1 }).limit(limit);
};

logSchema.statics.findByTransOrderNo = function(transOrderNo) {
  return this.find({ transOrderNo }).sort({ timestamp: 1 }); // chronological order for transaction logs
};

logSchema.statics.findRecent = function(hours = 1, level = null) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const query = { timestamp: { $gte: since } };
  
  if (level) {
    query.level = level;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

logSchema.statics.getLogSummary = function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          level: '$level',
          category: '$category'
        },
        count: { $sum: 1 },
        latestTimestamp: { $max: '$timestamp' },
        oldestTimestamp: { $min: '$timestamp' }
      }
    },
    {
      $project: {
        level: '$_id.level',
        category: '$_id.category',
        count: 1,
        latestTimestamp: 1,
        oldestTimestamp: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const Log = mongoose.model('Log', logSchema);

module.exports = Log;