# Authentication API - Bruno Collection

This Bruno collection contains comprehensive test cases for the QUANTRIX.AI Authentication System API.

## Overview

The Authentication API provides secure user authentication, registration, and session management capabilities for the QUANTRIX.AI platform.

## Endpoints Included

### 1. Register User (`POST /api/v1/auth/register`)
- **Purpose**: Create a new user account
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "confirmPassword": "string",
    "companyName": "string"
  }
  ```
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Response**: User data with generated `accountIdentifier`

### 2. Verify Account (`POST /api/v1/auth/verify-account`)
- **Purpose**: Verify account identifier exists and is valid
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "accountIdentifier": "string"
  }
  ```
- **Response**: Account verification status and user data

### 3. Login User (`POST /api/v1/auth/login`)
- **Purpose**: Authenticate user and receive access tokens
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "accountIdentifier": "string",
    "password": "string"
  }
  ```
- **Response**: Access token, refresh token, and user profile

### 4. Refresh Token (`POST /api/v1/auth/refresh`)
- **Purpose**: Generate new access token using refresh token
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response**: New access token with expiration

### 5. Get Profile (`GET /api/v1/auth/profile`)
- **Purpose**: Retrieve authenticated user's profile
- **Authentication**: Bearer token required
- **Response**: Complete user profile data

### 6. Logout User (`POST /api/v1/auth/logout`)
- **Purpose**: Invalidate user session and tokens
- **Authentication**: Bearer token required
- **Request Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response**: Logout confirmation

### 7. Health Check (`GET /api/v1/auth/health`)
- **Purpose**: Check API service health and status
- **Authentication**: None required
- **Response**: Service health information

## Environment Variables

The collection uses the following environment variables:

- `baseUrl`: API base URL (default: `http://localhost:5000`)
- `accessToken`: JWT access token for authenticated requests
- `refreshToken`: JWT refresh token for token renewal

## Test Coverage

Each endpoint includes comprehensive test cases that verify:

- ✅ HTTP status codes
- ✅ Response structure and required properties
- ✅ Data validation and format
- ✅ Authentication token validity
- ✅ Business logic compliance
- ✅ Error handling scenarios

## Usage Instructions

1. **Setup Environment**: Configure the `Development` environment with your API base URL
2. **Run Registration**: Execute "Register User" to create a test account
3. **Login**: Use "Login User" with the registered credentials
4. **Set Tokens**: Copy the returned tokens to environment variables
5. **Test Protected Endpoints**: Run "Get Profile" and "Logout User"
6. **Token Refresh**: Test "Refresh Token" functionality
7. **Health Check**: Verify API availability with "Health Check"

## Security Features Tested

- ✅ Password strength validation
- ✅ JWT token generation and validation
- ✅ Secure session management
- ✅ Account identifier uniqueness
- ✅ Protected endpoint authorization
- ✅ Token expiration handling

## Notes

- All endpoints include proper error handling and validation
- Request IDs are automatically generated for tracing
- Tokens have appropriate expiration times (15 minutes for access, 7 days for refresh)
- The system uses bcrypt for password hashing
- Account identifiers are automatically generated in format: `XXX-YYYY`

## Troubleshooting

If tests fail, check:
1. API service is running on the correct port
2. Database connection is established
3. Environment variables are properly configured
4. JWT_SECRET is set in the environment
5. Supabase configuration is valid

For detailed API documentation, refer to the Authentication System PRD and Technical Architecture documents.