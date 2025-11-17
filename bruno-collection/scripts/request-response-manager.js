/**
 * Request/Response Environment Manager for Bruno Collection
 * This script provides utilities to automatically manage environment variables
 * for each request and response in the collection.
 * 
 * Usage in Bruno scripts:
 * 
 * Pre-request script:
 *   const { trackRequest } = require('./scripts/request-response-manager.js');
 *   trackRequest(req, 'MyRequestName');
 * 
 * Post-response script:
 *   const { trackResponse } = require('./scripts/request-response-manager.js');
 *   trackResponse(res, 'MyRequestName');
 */

/**
 * Track request data in environment variables
 * @param {Object} req - Bruno request object
 * @param {string} requestName - Name of the request for tracking
 */
function trackRequest(req, requestName) {
  try {
    const timestamp = new Date().toISOString();
    
    // Store basic request info
    bru.setEnvVar(`${requestName}.lastRequestTime`, timestamp);
    bru.setEnvVar(`${requestName}.requestMethod`, req.method);
    bru.setEnvVar(`${requestName}.requestUrl`, req.url);
    
    // Store request headers (excluding sensitive ones)
    if (req.headers) {
      const safeHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        if (!lowerKey.includes('authorization') && 
            !lowerKey.includes('cookie') && 
            !lowerKey.includes('token')) {
          safeHeaders[key] = value;
        }
      }
      bru.setEnvVar(`${requestName}.requestHeaders`, JSON.stringify(safeHeaders));
    }
    
    // Store request body (if it's JSON and not too large)
    if (req.body && typeof req.body === 'object') {
      try {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length < 1000) { // Only store small bodies
          bru.setEnvVar(`${requestName}.requestBody`, bodyStr);
        }
      } catch (e) {
        // Ignore JSON serialization errors
      }
    }
    
    console.log(`📤 Tracked request: ${requestName}`);
  } catch (error) {
    console.error(`❌ Error tracking request ${requestName}:`, error.message);
  }
}

/**
 * Track response data in environment variables
 * @param {Object} res - Bruno response object
 * @param {string} requestName - Name of the request for tracking
 * @param {Object} options - Options for tracking
 */
function trackResponse(res, requestName, options = {}) {
  try {
    const timestamp = new Date().toISOString();
    const { persistTokens = true, extractUserData = true } = options;
    
    // Store basic response info
    bru.setEnvVar(`${requestName}.lastResponseTime`, timestamp);
    bru.setEnvVar(`${requestName}.lastResponseStatus`, res.status.toString());
    bru.setEnvVar(`${requestName}.responseDuration`, res.responseTime?.toString() || '0');
    
    // Store response headers
    if (res.headers) {
      bru.setEnvVar(`${requestName}.responseHeaders`, JSON.stringify(res.headers));
    }
    
    // Get response body
    let responseBody;
    try {
      responseBody = res.getBody();
    } catch (e) {
      console.warn(`⚠️ Could not parse response body for ${requestName}`);
      return;
    }
    
    if (!responseBody) {
      console.warn(`⚠️ No response body for ${requestName}`);
      return;
    }
    
    // Extract and store tokens if available
    if (persistTokens) {
      extractAndStoreTokens(responseBody, requestName);
    }
    
    // Extract and store user data if available
    if (extractUserData) {
      extractAndStoreUserData(responseBody, requestName);
    }
    
    // Store response summary
    const responseSummary = {
      status: res.status,
      timestamp: timestamp,
      hasData: !!responseBody.data,
      hasTokens: !!(responseBody.data?.token || responseBody.token),
      hasUserData: !!(responseBody.data?.user || responseBody.user)
    };
    
    bru.setEnvVar(`${requestName}.responseSummary`, JSON.stringify(responseSummary));
    
    console.log(`📥 Tracked response: ${requestName} (${res.status})`);
    
  } catch (error) {
    console.error(`❌ Error tracking response ${requestName}:`, error.message);
  }
}

/**
 * Extract and store authentication tokens
 * @param {Object} responseBody - Response body object
 * @param {string} requestName - Request name for variable naming
 */
function extractAndStoreTokens(responseBody, requestName) {
  try {
    let accessToken, refreshToken;
    
    // Check various token locations in response
    if (responseBody.data) {
      accessToken = responseBody.data.token || responseBody.data.accessToken || responseBody.data.access_token;
      refreshToken = responseBody.data.refreshToken || responseBody.data.refresh_token;
    }
    
    // Fallback to root level
    if (!accessToken) {
      accessToken = responseBody.token || responseBody.accessToken || responseBody.access_token;
    }
    if (!refreshToken) {
      refreshToken = responseBody.refreshToken || responseBody.refresh_token;
    }
    
    // Store tokens with persistence
    if (accessToken) {
      bru.setEnvVar(`${requestName}.accessToken`, accessToken, { persist: true });
      
      // Try to extract JWT expiry
      let tokenExpiry;
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp) {
            tokenExpiry = new Date(payload.exp * 1000).toISOString();
            bru.setEnvVar(`${requestName}.tokenExpiry`, tokenExpiry, { persist: true });
          }
        }
      } catch (e) {
        // Fallback expiry (15 minutes from now)
        tokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        bru.setEnvVar(`${requestName}.tokenExpiry`, tokenExpiry, { persist: true });
      }
      
      console.log(`🔑 Stored access token for ${requestName}`);
    }
    
    if (refreshToken) {
      bru.setEnvVar(`${requestName}.refreshToken`, refreshToken, { persist: true });
      
      // Refresh token expiry (7 days from now)
      const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      bru.setEnvVar(`${requestName}.refreshTokenExpiry`, refreshExpiry, { persist: true });
      
      console.log(`🔄 Stored refresh token for ${requestName}`);
    }
    
  } catch (error) {
    console.warn(`⚠️ Error extracting tokens for ${requestName}:`, error.message);
  }
}

/**
 * Extract and store user data
 * @param {Object} responseBody - Response body object
 * @param {string} requestName - Request name for variable naming
 */
function extractAndStoreUserData(responseBody, requestName) {
  try {
    let userData;
    
    // Check various user data locations
    if (responseBody.data && responseBody.data.user) {
      userData = responseBody.data.user;
    } else if (responseBody.user) {
      userData = responseBody.user;
    }
    
    if (!userData) {
      return; // No user data to store
    }
    
    // Store individual user fields
    const userFields = ['id', 'username', 'email', 'fullName', 'firstName', 'lastName', 
                       'accountIdentifier', 'isVerified', 'profilePictureUrl'];
    
    userFields.forEach(field => {
      if (userData[field] !== undefined && userData[field] !== null) {
        bru.setEnvVar(`${requestName}.user.${field}`, userData[field].toString(), { persist: true });
      }
    });
    
    // Store complete user data as JSON
    bru.setEnvVar(`${requestName}.userData`, JSON.stringify(userData), { persist: true });
    
    console.log(`👤 Stored user data for ${requestName}`);
    
  } catch (error) {
    console.warn(`⚠️ Error extracting user data for ${requestName}:`, error.message);
  }
}

/**
 * Get stored request/response data
 * @param {string} requestName - Name of the request
 * @param {string} dataType - Type of data to retrieve ('request', 'response', 'tokens', 'user')
 * @returns {Object} Retrieved data
 */
function getStoredData(requestName, dataType = 'response') {
  try {
    switch (dataType) {
      case 'request':
        return {
          time: bru.getEnvVar(`${requestName}.lastRequestTime`),
          method: bru.getEnvVar(`${requestName}.requestMethod`),
          url: bru.getEnvVar(`${requestName}.requestUrl`),
          headers: JSON.parse(bru.getEnvVar(`${requestName}.requestHeaders`) || '{}'),
          body: JSON.parse(bru.getEnvVar(`${requestName}.requestBody`) || 'null')
        };
        
      case 'response':
        return {
          time: bru.getEnvVar(`${requestName}.lastResponseTime`),
          status: bru.getEnvVar(`${requestName}.lastResponseStatus`),
          duration: bru.getEnvVar(`${requestName}.responseDuration`),
          headers: JSON.parse(bru.getEnvVar(`${requestName}.responseHeaders`) || '{}'),
          summary: JSON.parse(bru.getEnvVar(`${requestName}.responseSummary`) || 'null')
        };
        
      case 'tokens':
        return {
          accessToken: bru.getEnvVar(`${requestName}.accessToken`),
          tokenExpiry: bru.getEnvVar(`${requestName}.tokenExpiry`),
          refreshToken: bru.getEnvVar(`${requestName}.refreshToken`),
          refreshTokenExpiry: bru.getEnvVar(`${requestName}.refreshTokenExpiry`)
        };
        
      case 'user':
        return {
          data: JSON.parse(bru.getEnvVar(`${requestName}.userData`) || 'null'),
          id: bru.getEnvVar(`${requestName}.user.id`),
          username: bru.getEnvVar(`${requestName}.user.username`),
          email: bru.getEnvVar(`${requestName}.user.email`)
        };
        
      default:
        return null;
    }
  } catch (error) {
    console.error(`❌ Error retrieving stored data for ${requestName}:`, error.message);
    return null;
  }
}

/**
 * Clear stored data for a specific request
 * @param {string} requestName - Name of the request
 * @param {string} dataType - Type of data to clear ('request', 'response', 'tokens', 'user', 'all')
 */
function clearStoredData(requestName, dataType = 'all') {
  try {
    const prefixes = dataType === 'all' 
      ? [`${requestName}.`]
      : [`${requestName}.${dataType}`];
    
    // Get all environment variables
    const allVars = Object.keys(bru.getEnvVars() || {});
    
    let clearedCount = 0;
    allVars.forEach(varName => {
      if (prefixes.some(prefix => varName.startsWith(prefix))) {
        bru.setEnvVar(varName, ''); // Clear the variable
        clearedCount++;
      }
    });
    
    console.log(`🧹 Cleared ${clearedCount} variables for ${requestName} (${dataType})`);
    
  } catch (error) {
    console.error(`❌ Error clearing stored data for ${requestName}:`, error.message);
  }
}

/**
 * Validate stored tokens
 * @param {string} requestName - Name of the request
 * @returns {Object} Validation results
 */
function validateTokens(requestName) {
  try {
    const tokens = getStoredData(requestName, 'tokens');
    const now = new Date();
    
    const results = {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      accessTokenExpired: false,
      refreshTokenExpired: false,
      accessTokenExpiry: null,
      refreshTokenExpiry: null
    };
    
    if (tokens.tokenExpiry) {
      const expiry = new Date(tokens.tokenExpiry);
      results.accessTokenExpiry = expiry.toISOString();
      results.accessTokenExpired = expiry <= now;
    }
    
    if (tokens.refreshTokenExpiry) {
      const expiry = new Date(tokens.refreshTokenExpiry);
      results.refreshTokenExpiry = expiry.toISOString();
      results.refreshTokenExpired = expiry <= now;
    }
    
    results.isValid = results.hasAccessToken && !results.accessTokenExpired;
    
    console.log(`🔍 Token validation for ${requestName}:`, results);
    return results;
    
  } catch (error) {
    console.error(`❌ Error validating tokens for ${requestName}:`, error.message);
    return { isValid: false, error: error.message };
  }
}

// Export functions for use in Bruno scripts
module.exports = {
  trackRequest,
  trackResponse,
  getStoredData,
  clearStoredData,
  validateTokens
};