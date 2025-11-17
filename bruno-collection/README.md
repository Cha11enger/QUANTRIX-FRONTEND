# QUANTRIX Bruno API Collection

A comprehensive Bruno API collection for the QUANTRIX backend system with dynamic environment management and TypeScript automation.

## 🚀 Features

- **Dynamic Environment Management**: Seamlessly switch between development, staging, and production environments
- **TypeScript Automation**: Automated collection generation and environment synchronization
- **Comprehensive API Coverage**: Complete coverage of all QUANTRIX API endpoints
- **Authentication Flow**: Automated token management and authentication workflows
- **CI/CD Integration**: Ready-to-use GitHub Actions workflow for automated testing
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## 📁 Collection Structure

```
bruno-collection/
├── environments/           # Environment configurations
│   ├── development.bru    # Development environment
│   ├── staging.bru        # Staging environment
│   └── production.bru     # Production environment
├── Health/                # Health check endpoints
├── Authentication/        # Auth endpoints (register, login, profile)
├── API/                  # API information endpoints
├── Roles/                # User roles endpoints (limited)
├── Users/                # User management endpoints
├── Profile/              # User profile endpoints
├── Supabase/             # Supabase integration endpoints
├── scripts/              # TypeScript automation scripts
├── types/                # TypeScript type definitions
└── docs/                 # Documentation
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- Bruno CLI installed globally: `npm install -g @usebruno/cli`
- TypeScript: `npm install -g typescript ts-node`

### Installation

1. Navigate to the Bruno collection directory:
   ```bash
   cd bruno-collection
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate the collection and update environments:
   ```bash
   npm run setup
   ```

## 🔧 Configuration

### Environment Variables

The collection automatically syncs with your project's `.env` files. Key variables include:

```env
# API Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=your_database_url

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Environment Files

Each environment file (`.bru`) contains:

- **Public Variables**: API URLs, timeouts, retry settings
- **Secret Variables**: Tokens, API keys (stored securely by Bruno)

## 🎯 Usage

### Running Tests

```bash
# Test all endpoints in development
npm run test

# Test specific environment
npm run test:staging
npm run test:production

# Test specific folders
npm run test:health
npm run test:auth
npm run test:api
```

### Manual Testing

1. Open Bruno and load the collection
2. Select your desired environment (development/staging/production)
3. Run the "Register User" request to create a test account
4. Run "Login User" to authenticate and get tokens
5. Use other endpoints with automatic token management

### Automation Scripts

```bash
# Generate collection from route definitions
npm run generate

# Update environments from .env files
npm run update-env

# Validate environment configurations
npm run validate-env

# Create new environment template
npm run create-env <environment-name>
```

## 🔄 Workflow

### Authentication Flow

1. **Register User** → Creates account and returns account identifier
2. **Login User** → Authenticates and stores access/refresh tokens
3. **Protected Endpoints** → Automatically use stored tokens
4. **Refresh Token** → Renew tokens when expired

### Environment Management

1. Update your `.env` files with new values
2. Run `npm run update-env` to sync with Bruno environments
3. Switch environments in Bruno UI
4. All requests automatically use the correct environment variables

## 📊 Testing & Validation

### Automated Tests

Each request includes comprehensive tests:

- Status code validation
- Response structure validation
- Authentication checks
- Data integrity tests

### Pre/Post Request Scripts

- **Pre-request**: Generate unique request IDs, validate tokens
- **Post-response**: Store tokens, log responses, handle errors

## 🚀 CI/CD Integration

### GitHub Actions

The collection includes a ready-to-use GitHub Actions workflow:

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @usebruno/cli
      - run: cd bruno-collection && npm install
      - run: cd bruno-collection && npm run ci
```

### Local CI Testing

```bash
# Run the same tests as CI
npm run ci
```

## 🔧 Development

### Adding New Endpoints

1. Add route definition to `scripts/generate-collection.ts`
2. Run `npm run generate` to create Bruno files
3. Customize the generated `.bru` files as needed
4. Update tests and documentation

### Custom Scripts

Create custom automation scripts in the `scripts/` directory:

```typescript
import { BrunoCollectionGenerator } from './generate-collection';

// Your custom logic here
```

## 📚 API Documentation

### Health Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/readiness` - Kubernetes readiness probe
- `GET /health/liveness` - Kubernetes liveness probe

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - User authentication
- `GET /auth/profile` - Get user profile
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### API Information

- `GET /api` - API information
- `GET /api/docs` - API documentation
- `GET /api/metrics` - API metrics
- `GET /api/versions` - Available versions

## 🛡️ Security

### Token Management

- Access tokens are automatically managed
- Refresh tokens are securely stored
- Expired tokens trigger automatic refresh

### Environment Security

- Secret variables are encrypted by Bruno
- Environment files exclude sensitive data
- `.gitignore` configured to protect secrets

## 🐛 Troubleshooting

### Common Issues

1. **"No access token found"**
   - Run the "Login User" request first
   - Check if token has expired

2. **"Environment not found"**
   - Run `npm run update-env`
   - Verify environment files exist

3. **"Request failed with 401"**
   - Token may be expired, run "Refresh Token"
   - Verify authentication credentials

### Debug Mode

Enable debug logging by setting `logLevel: debug` in your environment file.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add/modify Bruno requests
4. Update documentation
5. Run tests: `npm run ci`
6. Submit a pull request

## 📄 License

This Bruno collection is part of the QUANTRIX project and follows the same license terms.

## 🤝 Support

For issues and questions:

1. Check the troubleshooting section
2. Review Bruno documentation: https://docs.usebruno.com
3. Create an issue in the project repository

---

**Happy Testing! 🎉**