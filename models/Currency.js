/**
 * Currency enumeration - matches Java Currency enum
 */
const Currency = {
  USD: 'USD',
  ZWG: 'ZWG',
  ZAR: 'ZAR',
  GBP: 'GBP',
  EUR: 'EUR'
};

// Validate currency
Currency.isValid = function(currency) {
  return Object.values(Currency).includes(currency);
};

// Get all valid currencies
Currency.getAll = function() {
  return Object.values(Currency);
};

module.exports = Currency;