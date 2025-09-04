# OneMoney Integration API

A restructured Node.js application for integrating with OneMoney payment gateway using proper MVC architecture.

## Project Structure

```
onemoney-integration/
├── config/
│   ├── constants.js          # Configuration constants and keys
│   └── environment.js        # Environment-specific configuration
├── middleware/
│   └── validation.js         # Request validation and rate limiting
├── models/
│   ├── PaymentRequest.js     # Payment request model
│   ├── PaymentResponse.js    # Payment response model
│   └── EncryptedPayload.js   # Encrypted payload model
├── routes/
│   ├── index.js              # Main router
│   └── paymentRoutes.js      # Payment-specific routes
├── services/
│   ├── cryptoService.js      # Cryptographic operations
│   └── paymentService.js     # Payment processing logic
├── .env.example              # Environment variables template
├── index.js                  # Application entry point
└── package.json              # Dependencies and scripts
```

## Installation

1. Clone the repository and navigate to the onemoney-integration directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment template and configure:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` file with your configuration

## Configuration

Update the following in your `.env` file:

- `ONEMONEY_ENDPOINT`: OneMoney API endpoint
- `NOTIFY_URL`: Your callback URL for payment notifications
- `MERCHANT_NUMBER`: Your merchant number
- `ENCRYPT_KEY_ID`: Your encryption key ID
- `SECRET_KEY`: Your AES encryption key (16 characters)

## Available Endpoints

### Health Check
```
GET /health
```

### Payment Operations
```
POST /api/payment                      # Initiate payment
POST /api/payment/callback             # Handle payment callbacks
GET /api/payment/status/:transOrderNo  # Check payment status
POST /api/payment/test                 # Test integration
```

## Usage

### Starting the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Making a Payment Request

```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNo": "712980059",
    "currency": "ZWG",
    "orderAmt": 100,
    "goodsName": "Test Payment"
  }'
```

## Key Features

### Models
- **PaymentRequest**: Validates and structures payment requests
- **PaymentResponse**: Handles payment responses from OneMoney
- **EncryptedPayload**: Manages encrypted data payloads

### Services
- **CryptoService**: Handles RSA/AES encryption/decryption and signing
- **PaymentService**: Manages payment processing and OneMoney API communication

### Security
- RSA encryption using OneMoney's public key
- AES encryption with ECB mode
- SHA-256 signature verification
- Request validation and rate limiting

### Error Handling
- Comprehensive error handling with proper HTTP status codes
- Environment-specific error details
- Request tracking with unique IDs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production/test) | development |
| ONEMONEY_ENDPOINT | OneMoney API URL | - |
| NOTIFY_URL | Payment callback URL | - |
| MERCHANT_NUMBER | Merchant identifier | - |
| ENCRYPT_KEY_ID | Encryption key identifier | - |
| SECRET_KEY | AES encryption key | - |

## Development

The application follows MVC architecture principles:

- **Models**: Data validation and structure
- **Views**: JSON API responses
- **Controllers**: Route handlers in the routes directory
- **Services**: Business logic and external API communication

## Testing

Test the integration:
```bash
curl -X POST http://localhost:3000/api/payment/test
```

## Dependencies

- **express**: Web application framework
- **axios**: HTTP client for API requests
- **node-forge**: RSA encryption/decryption
- **crypto-js**: AES encryption and hashing
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management