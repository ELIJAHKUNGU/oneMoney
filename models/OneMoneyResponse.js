/**
 * OneMoney API Response - matches Java OneMoneyResponse
 */
class OneMoneyResponse {
  constructor(statusCode = 0, body = null) {
    this.statusCode = statusCode;
    this.body = body; // A JsonString which can be manipulated using any parser of your choice
  }

  getStatusCode() {
    return this.statusCode;
  }

  setStatusCode(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  getBody() {
    return this.body;
  }

  setBody(body) {
    this.body = body;
    return this;
  }

  isSuccess() {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  getBodyAsJson() {
    if (!this.body) return null;
    try {
      return JSON.parse(this.body);
    } catch (error) {
      console.error('Failed to parse response body as JSON:', error);
      return null;
    }
  }
}

module.exports = OneMoneyResponse;