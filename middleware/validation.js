const PaymentRequest = require('../models/PaymentRequest');

// Validate payment request middleware
const validatePaymentRequest = (req, res, next) => {
  try {
    const paymentRequest = PaymentRequest.fromRequestBody(req.body);
    const validation = paymentRequest.validate();

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment data',
        errors: validation.errors
      });
    }

    // Attach validated payment request to req object
    req.paymentRequest = paymentRequest;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request format',
      error: error.message
    });
  }
};

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();

const rateLimit = (windowMs = 60000, maxRequests = 10) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitMap.has(clientIp)) {
      rateLimitMap.set(clientIp, []);
    }

    const requests = rateLimitMap.get(clientIp);
    
    // Clean old requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    // Add current request
    validRequests.push(now);
    rateLimitMap.set(clientIp, validRequests);

    next();
  };
};

// Request ID middleware for tracking
const requestId = (req, res, next) => {
  req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

module.exports = {
  validatePaymentRequest,
  rateLimit,
  requestId
};