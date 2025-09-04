const Log = require('../models/Log');
const CallbackLog = require('../models/CallbackLog');
const crypto = require('crypto');

class LoggingService {
  constructor() {
    this.requestId = null;
    this.context = {};
  }

  // Set request context (usually from middleware)
  setContext(context) {
    this.context = { ...this.context, ...context };
    return this;
  }

  // Set request ID for tracking
  setRequestId(requestId = null) {
    this.requestId = requestId || crypto.randomUUID();
    return this;
  }

  // Clear context (useful for new requests)
  clearContext() {
    this.context = {};
    this.requestId = null;
    return this;
  }

  // Generic log method
  async log(level, category, message, details = null, additionalContext = {}) {
    try {
      const logData = {
        level,
        category,
        message,
        details,
        requestId: this.requestId,
        ...this.context,
        ...additionalContext,
        timestamp: new Date()
      };

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const consoleMessage = `[${level.toUpperCase()}] ${category}: ${message}`;
        console.log(consoleMessage, details ? details : '');
      }

      return await Log.create(logData);
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to save log to database:', error);
      console.log(`[${level.toUpperCase()}] ${category}: ${message}`, details);
    }
  }

  // Error logging
  async error(message, error = null, context = {}) {
    const errorDetails = {
      category: context.category || 'system',
      module: context.module,
      function: context.function,
      transOrderNo: context.transOrderNo,
      details: context.details
    };

    if (error instanceof Error) {
      errorDetails.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }

    return await this.log('error', context.category || 'system', message, errorDetails, context);
  }

  // Warning logging
  async warn(message, context = {}) {
    return await this.log('warn', context.category || 'system', message, context.details, context);
  }

  // Info logging
  async info(message, context = {}) {
    return await this.log('info', context.category || 'system', message, context.details, context);
  }

  // Debug logging
  async debug(message, context = {}) {
    // Only log debug in development
    if (process.env.NODE_ENV === 'development') {
      return await this.log('debug', context.category || 'system', message, context.details, context);
    }
  }

  // Payment-specific logging methods
  async logPaymentInitiated(transOrderNo, paymentData) {
    return await this.info('Payment initiated', {
      category: 'payment',
      module: 'PaymentService',
      function: 'initiatePayment',
      transOrderNo,
      details: {
        mobileNo: paymentData.mobileNo,
        amount: paymentData.orderAmt,
        currency: paymentData.currency,
        goodsName: paymentData.goodsName
      },
      tags: ['payment_initiated']
    });
  }

  async logPaymentResponse(transOrderNo, response, success = true) {
    const level = success ? 'info' : 'error';
    const message = success ? 'Payment response received' : 'Payment response error';
    
    return await this.log(level, 'payment', message, {
      module: 'PaymentService',
      function: 'processPaymentResponse',
      transOrderNo,
      details: response,
      tags: ['payment_response']
    });
  }

  async logCallbackReceived(transOrderNo, callbackData) {
    return await this.info('Payment callback received', {
      category: 'callback',
      module: 'paymentRoutes',
      function: 'callback',
      transOrderNo,
      details: callbackData,
      tags: ['callback_received']
    });
  }

  async logCallbackProcessed(transOrderNo, success = true, error = null) {
    const level = success ? 'info' : 'error';
    const message = success ? 'Callback processed successfully' : 'Callback processing failed';
    
    const context = {
      category: 'callback',
      module: 'paymentRoutes',
      function: 'callback',
      transOrderNo,
      tags: ['callback_processed']
    };

    if (error) {
      return await this.error(message, error, context);
    } else {
      return await this.info(message, context);
    }
  }

  // API logging methods
  async logApiRequest(method, url, requestData = null) {
    return await this.info('API request', {
      category: 'api',
      module: 'PaymentService',
      details: {
        method,
        url,
        requestData
      },
      tags: ['api_request']
    });
  }

  async logApiResponse(method, url, responseData, statusCode = 200) {
    const level = statusCode >= 400 ? 'error' : 'info';
    const message = statusCode >= 400 ? 'API error response' : 'API response';
    
    return await this.log(level, 'api', message, {
      module: 'PaymentService',
      details: {
        method,
        url,
        statusCode,
        responseData
      },
      tags: ['api_response']
    });
  }

  // Encryption logging methods
  async logEncryptionEvent(event, success = true, details = null) {
    const level = success ? 'debug' : 'error';
    const message = `Encryption ${event} ${success ? 'successful' : 'failed'}`;
    
    return await this.log(level, 'encryption', message, {
      module: 'CryptoService',
      details,
      tags: ['encryption', event]
    });
  }

  // Database operation logging
  async logDatabaseOperation(operation, model, success = true, error = null) {
    const level = success ? 'debug' : 'error';
    const message = `Database ${operation} on ${model} ${success ? 'successful' : 'failed'}`;
    
    const context = {
      category: 'database',
      details: { operation, model },
      tags: ['database', operation]
    };

    if (error) {
      return await this.error(message, error, context);
    } else {
      return await this.log(level, 'database', message, context.details, context);
    }
  }

  // Security event logging
  async logSecurityEvent(event, severity = 'warn', details = null) {
    return await this.log(severity, 'security', event, {
      details,
      tags: ['security', event.toLowerCase().replace(/\s+/g, '_')]
    });
  }

  // Performance logging
  async logPerformance(operation, duration, details = null) {
    return await this.info(`Performance: ${operation}`, {
      category: 'system',
      details: {
        operation,
        duration: `${duration}ms`,
        ...details
      },
      tags: ['performance']
    });
  }

  // Callback log creation helper
  async createCallbackLog(req, transOrderNo, callbackType = 'payment_notification') {
    try {
      const callbackLog = CallbackLog.createFromRequest(req, transOrderNo, callbackType);
      await callbackLog.save();
      
      // Also create a general log entry
      await this.logCallbackReceived(transOrderNo, req.body);
      
      return callbackLog;
    } catch (error) {
      await this.error('Failed to create callback log', error, {
        category: 'callback',
        transOrderNo
      });
      throw error;
    }
  }

  // Log search and retrieval methods
  async getRecentLogs(hours = 24, level = null) {
    return await Log.findRecent(hours, level);
  }

  async getTransactionLogs(transOrderNo) {
    return await Log.findByTransOrderNo(transOrderNo);
  }

  async getLogSummary(startDate = null, endDate = null) {
    return await Log.getLogSummary(startDate, endDate);
  }

  async getCallbackLogs(transOrderNo = null) {
    if (transOrderNo) {
      return await CallbackLog.findByTransOrderNo(transOrderNo);
    }
    return await CallbackLog.findRecentCallbacks();
  }

  // Cleanup methods
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const logResult = await Log.deleteMany({ timestamp: { $lt: cutoffDate } });
      const callbackResult = await CallbackLog.deleteMany({ receivedAt: { $lt: cutoffDate } });
      
      await this.info('Log cleanup completed', {
        category: 'system',
        module: 'LoggingService',
        function: 'cleanupOldLogs',
        details: {
          logsDeleted: logResult.deletedCount,
          callbackLogsDeleted: callbackResult.deletedCount,
          cutoffDate
        },
        tags: ['cleanup', 'maintenance']
      });

      return {
        logsDeleted: logResult.deletedCount,
        callbackLogsDeleted: callbackResult.deletedCount
      };
    } catch (error) {
      await this.error('Log cleanup failed', error, {
        category: 'system',
        module: 'LoggingService',
        function: 'cleanupOldLogs'
      });
      throw error;
    }
  }
}

// Create singleton instance
const loggingService = new LoggingService();

module.exports = loggingService;