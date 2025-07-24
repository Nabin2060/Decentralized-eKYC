# Decentralized eKYC Backend

A comprehensive backend system for decentralized electronic Know Your Customer (eKYC) with blockchain integration, IPFS storage, and Verifiable Credentials.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Verifiable Credentials**: DID/VC generation and management using W3C standards
- **Blockchain Integration**: Ethereum smart contract integration for credential storage
- **IPFS Storage**: Decentralized storage for credentials and consent data
- **Consent Management**: GDPR-compliant consent request and approval system
- **Security**: Rate limiting, input validation, and secure password handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Blockchain**: Ethereum with Ethers.js
- **Storage**: IPFS (InterPlanetary File System)
- **Identity**: DID/VC with did-jwt and vc-js
- **Security**: bcryptjs, helmet, express-rate-limit

## Project Structure

```
backend/
├── models/              # Database models
│   ├── User.js         # User model with authentication
│   ├── Credential.js   # Verifiable credential model
│   └── Consent.js      # Consent management model
├── controllers/         # Business logic controllers
│   ├── authController.js
│   ├── credentialController.js
│   └── consentController.js
├── routes/             # API route definitions
│   ├── auth.js
│   ├── credentials.js
│   └── consent.js
├── middleware/         # Custom middleware
│   ├── auth.js        # JWT authentication
│   └── validation.js  # Request validation
├── services/          # External service integrations
│   ├── ipfsService.js
│   ├── blockchainService.js
│   └── didService.js
├── server.js          # Main application entry point
├── package.json       # Dependencies and scripts
└── env.example        # Environment variables template
```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**

   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/decentralized_ekyc

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHEREUM_PRIVATE_KEY=your-ethereum-private-key
SMART_CONTRACT_ADDRESS=your-smart-contract-address

# DID Configuration
DID_METHOD=did:ethr
DID_PRIVATE_KEY=your-did-private-key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication

| Method | Endpoint                | Description         | Auth Required |
| ------ | ----------------------- | ------------------- | ------------- |
| POST   | `/auth/register`        | Register new user   | No            |
| POST   | `/auth/login`           | Login user          | No            |
| GET    | `/auth/profile`         | Get user profile    | Yes           |
| PUT    | `/auth/profile`         | Update user profile | Yes           |
| POST   | `/auth/change-password` | Change password     | Yes           |
| POST   | `/auth/refresh-token`   | Refresh JWT token   | Yes           |

### Credentials

| Method | Endpoint                            | Description             | Auth Required | Role Required      |
| ------ | ----------------------------------- | ----------------------- | ------------- | ------------------ |
| POST   | `/credentials/issue`                | Issue new credential    | Yes           | issuer/admin       |
| GET    | `/credentials/user/:id`             | Get user credentials    | Yes           | owner/admin        |
| GET    | `/credentials/:credentialId`        | Get specific credential | Yes           | owner/issuer/admin |
| POST   | `/credentials/revoke`               | Revoke credential       | Yes           | issuer/admin       |
| GET    | `/credentials/:credentialId/verify` | Verify credential       | Yes           | any                |

### Consent

| Method | Endpoint                       | Description          | Auth Required | Role Required         |
| ------ | ------------------------------ | -------------------- | ------------- | --------------------- |
| POST   | `/consent/request`             | Request consent      | Yes           | verifier/issuer/admin |
| POST   | `/consent/:consentId/approve`  | Approve consent      | Yes           | data subject          |
| POST   | `/consent/:consentId/reject`   | Reject consent       | Yes           | data subject          |
| GET    | `/consent/user/:id`            | Get user consents    | Yes           | owner/admin           |
| GET    | `/consent/:consentId`          | Get specific consent | Yes           | involved parties      |
| POST   | `/consent/:consentId/withdraw` | Withdraw consent     | Yes           | data subject          |

## Usage Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "user",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01"
    }
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Issue a credential

```bash
curl -X POST http://localhost:3000/credentials/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "holderId": "USER_ID",
    "type": "identity",
    "credentialSubject": {
      "name": "John Doe",
      "dateOfBirth": "1990-01-01",
      "nationality": "US"
    },
    "expirationDate": "2025-12-31T23:59:59Z",
    "metadata": {
      "description": "Identity verification credential",
      "category": "personal"
    }
  }'
```

### Request consent

```bash
curl -X POST http://localhost:3000/consent/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "dataSubjectId": "USER_ID",
    "purpose": "KYC verification for financial services",
    "type": "explicit",
    "dataCategories": ["personal_info", "identity_documents"],
    "validUntil": "2024-12-31T23:59:59Z",
    "consentDetails": {
      "isRevocable": true,
      "requiresReconsent": false
    }
  }'
```

## User Roles

- **user**: Regular user who can hold credentials and manage consents
- **issuer**: Can issue verifiable credentials to users
- **verifier**: Can request consent and verify credentials
- **admin**: Full system access and management capabilities

## Security Features

- **Password Security**: bcrypt hashing with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: HTTP headers security middleware

## Blockchain Integration

The system integrates with Ethereum blockchain for:

- Storing credential hashes on-chain
- Immutable audit trail
- Decentralized verification
- Smart contract-based revocation

## IPFS Integration

IPFS is used for:

- Decentralized storage of credential data
- Content-addressed storage
- Permanent and immutable data storage
- Distributed content delivery

## DID/VC Standards

The system implements W3C standards for:

- Decentralized Identifiers (DIDs)
- Verifiable Credentials (VCs)
- Verifiable Presentations (VPs)
- DID resolution and verification

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure production MongoDB
4. Set up IPFS node
5. Deploy smart contracts
6. Use HTTPS
7. Configure proper CORS settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue on GitHub or contact the development team.
