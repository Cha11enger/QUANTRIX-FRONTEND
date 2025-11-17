# Bruno Environment Management Scripts

This directory contains scripts to automatically manage environment variables for each request and response in your Bruno collection.

## 🚀 Quick Start

### 1. Auto-Tracked Login
Use the `AutoTrackedLogin.bru` request to automatically:
- Track login requests
- Extract and store tokens with persistence
- Validate token storage
- Copy tokens to standard locations

### 2. Auto-Tracked Profile
Use the `AutoTrackedProfile.bru` request to:
- Automatically validate tokens before requests
- Track profile requests and responses
- Extract and store user profile data
- Update environment variables with latest profile info

## 📋 Available Scripts

### `request-response-manager.js`
Main script for tracking requests and responses with automatic token and user data extraction.

**Key Functions:**
- `trackRequest(req, requestId)` - Track request details
- `trackResponse(res, requestId, options)` - Track response and extract data
- `extractAndStoreTokens(responseData, requestId)` - Extract and store tokens
- `extractAndStoreUserData(responseData, requestId)` - Extract and store user data
- `validateTokens(requestId)` - Validate stored tokens
- `getStoredData(requestId, type)` - Retrieve stored data
- `clearStoredData(requestId)` - Clear stored data

### `env-manager.ts`
TypeScript utility for managing environment variables with backup and restore capabilities.

**Key Functions:**
- `initialize()` - Initialize environment manager
- `createBackup()` - Create backup of current environment
- `storeRequestData(requestId, data)` - Store request data
- `storeResponseData(requestId, data)` - Store response data
- `updateEnvironment()` - Update environment files

## 🔧 Usage Examples

### Basic Request Tracking
```javascript
// In pre-request script
const { trackRequest } = require('./scripts/request-response-manager.js');
trackRequest(req, 'MyRequest');

// In post-response script
const { trackResponse } = require('./scripts/request-response-manager.js');
trackResponse(res, 'MyRequest', {
  persistTokens: true,
  extractUserData: true
});
```

### Token Validation
```javascript
const { validateTokens } = require('./scripts/request-response-manager.js');

const validation = validateTokens('LoginRequest');
if (!validation.isValid) {
  console.log('Tokens invalid:', validation);
  // Handle invalid tokens
}
```

### Data Retrieval
```javascript
const { getStoredData } = require('./scripts/request-response-manager.js');

// Get stored tokens
const tokens = getStoredData('LoginRequest', 'tokens');
console.log('Access Token:', tokens.accessToken);

// Get stored user data
const user = getStoredData('LoginRequest', 'user');
console.log('User ID:', user.id);
```

## 📊 Data Structure

### Request Data
```json
{
  "requestId": "string",
  "time": "ISO timestamp",
  "method": "GET|POST|PUT|DELETE",
  "url": "string",
  "headers": {},
  "body": {}
}
```

### Response Data
```json
{
  "requestId": "string",
  "time": "ISO timestamp",
  "status": 200,
  "duration": 123,
  "headers": {},
  "body": {}
}
```

### Token Data
```json
{
  "requestId": "string",
  "accessToken": "string",
  "tokenExpiry": "ISO timestamp",
  "refreshToken": "string",
  "refreshTokenExpiry": "ISO timestamp"
}
```

### User Data
```json
{
  "requestId": "string",
  "id": "string",
  "username": "string",
  "email": "string",
  "data": {}
}
```

## 🛠️ Configuration Options

### trackResponse Options
```javascript
trackResponse(res, 'RequestId', {
  persistTokens: true,        // Store tokens with persistence
  extractUserData: true,    // Extract user data from response
  tokenPath: 'data.token',  // Custom path to token in response
  userDataPath: 'data.user' // Custom path to user data
});
```

## 🚨 Error Handling

The scripts include comprehensive error handling:
- Token validation with expiry checking
- Graceful handling of missing response data
- Automatic fallback for different response structures
- Detailed error logging and reporting

## 🔄 Data Flow

1. **Request**: Track request details before sending
2. **Response**: Track response and extract relevant data
3. **Storage**: Automatically store tokens and user data
4. **Validation**: Validate tokens before subsequent requests
5. **Cleanup**: Clear old data when needed

## 📈 Benefits

- ✅ Automatic token management
- ✅ Persistent environment variables
- ✅ Request/response tracking
- ✅ User data extraction
- ✅ Token validation
- ✅ Error handling
- ✅ Backup and restore capabilities
- ✅ TypeScript support
- ✅ CLI interface

## 🔍 Debugging

All scripts include detailed logging:
- Request/response tracking
- Token extraction and storage
- Validation results
- Error messages
- Data summaries

Check the console output in Bruno for detailed information about each operation.