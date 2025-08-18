# OneMoney Integration - Node.js Client

This Node.js implementation now **matches the Java `onemoney-client` structure** exactly, providing the same functionality and API interface.

## Features

✅ **Customer Registration** - Register new customers with KYC information  
✅ **File Upload** - Upload identification documents and photos  
✅ **C2B Payments** - Customer-to-business payment processing  
✅ **B2C Payments** - Business-to-customer disbursements  
✅ **Transaction Queries** - Check payment status  
✅ **Encryption** - RSA+AES hybrid encryption matching Java implementation  
✅ **Webhook Handling** - Process payment notifications  

## Installation

```bash
npm install
```

## Configuration

The client now uses the same constructor pattern as Java:

```javascript
const OneMoneyClient = require('./onemoney-client');
const EncryptionUtil = require('./encryption');

// Configuration (matches Java OneMoneyAPIClient constructor)
const baseUrl = 'http://172.28.255.24:8087';
const thirdPartyId = '1883151315996622850';
const plainPassword = '#3Wbetlni';
const thirdPartyCredential = EncryptionUtil.encryptCredential(plainPassword);

// For encrypted operations, provide private key
const privateKey = `-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----`;

const client = new OneMoneyClient(baseUrl, thirdPartyId, thirdPartyCredential, privateKey);
```

## Usage Examples

### Customer Registration

```javascript
const { OneMoneyCustomer } = require('./models');

const customer = new OneMoneyCustomer()
  .setMobile('712984123')
  .setFirstName('John')
  .setLastName('Doe')
  .setEmail('john.doe@example.com')
  .setGender('2') // 2: Male, 1: Female
  .setDateOfBirth('01011990') // ddMMyyyy format
  .setIdType('National ID')
  .setIdNumber('63-123456A90')
  .setNationality('ZW')
  .setAddress('123 Main Street, Harare');

const response = await client.registerCustomer(customer);
console.log('Status:', response.getStatusCode());
console.log('Response:', response.getBodyAsJson());
```

### File Upload

```javascript
const response = await client.uploadPicture('/path/to/image.jpg');
console.log('Upload Status:', response.getStatusCode());
console.log('Response:', response.getBodyAsJson());
```

### C2B Push Payment

```javascript
const paymentParams = {
  transOrderNo: Date.now().toString(),
  amt: 100,
  currency: 'ZWG',
  mobileNo: '710939852',
  goodsName: 'Test Product',
  notifyUrl: 'http://yourdomain.com/webhook' // optional
};

const response = await client.c2bPushPayment(paymentParams);
console.log('Payment Status:', response.getStatusCode());
console.log('Response:', response.getBodyAsJson());
```

### B2C Payment

```javascript
const disbursementParams = {
  transOrderNo: Date.now().toString(),
  orderAmt: 50,
  currency: 'ZWG',
  recCstMobile: '712984123',
  businessType: '1',
  remark: 'Salary Payment'
};

const response = await client.b2cPayment(disbursementParams);
console.log('Disbursement Status:', response.getStatusCode());
console.log('Response:', response.getBodyAsJson());
```

### Transaction Query

```javascript
const response = await client.c2bQuery('1732618067884');
console.log('Query Status:', response.getStatusCode());
console.log('Response:', response.getBodyAsJson());
```

## Data Models

The Node.js implementation now includes TypeScript-like data models that match Java POJOs:

- `OneMoneyCustomer` - Customer registration data
- `OneMoneyResponse` - API response wrapper
- `BaseReqDTO` - Base request structure
- `Currency` - Currency enumeration

## Encryption

The encryption now **exactly matches** the Java implementation:

- **Double Base64 encoding** for payload and keys
- **AES-ECB with PKCS7 padding** for data encryption
- **RSA-PKCS1** for key encryption
- **SHA-256** for digital signatures
- **Triple DES** for credential encryption

## Webhook Handling

Start the notification handler:

```bash
node notification.js
```

The webhook automatically decrypts incoming notifications and verifies signatures.

## Testing

Run the example:

```bash
node index.js
```

Generate test payloads:

```bash
node generate-payload.js
node generate-curl.js
```

## API Endpoints

- **Customer Registration**: `/api/internal/user/registration`
- **File Upload**: `/api/internal/oss/uploadFile`  
- **C2B Push**: `/api/pay/payment/push`
- **C2B Query**: `/api/pay/payment/order/status/query`
- **B2C Payment**: `/api/thirdParty/paying`
- **B2C Query**: `/api/thirdParty/paying/order/check`

## Error Handling

All methods return `OneMoneyResponse` objects with:
- `getStatusCode()` - HTTP status code
- `getBody()` - Raw response body (JSON string)  
- `getBodyAsJson()` - Parsed JSON object
- `isSuccess()` - Boolean success indicator

## Differences from Original

The Node.js implementation now:

✅ Uses the same constructor pattern as Java  
✅ Implements all Java methods (`registerCustomer`, `uploadPicture`)  
✅ Uses POJO-equivalent data models  
✅ Matches Java encryption exactly (double Base64)  
✅ Returns structured `OneMoneyResponse` objects  
✅ Includes credential encryption  
✅ Follows Java logging patterns  

This ensures **100% compatibility** with the Java `onemoney-client` behavior.