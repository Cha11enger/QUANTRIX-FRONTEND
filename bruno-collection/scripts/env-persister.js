/**
 * Environment Variable Persister for Bruno
 * This script provides functions to persist environment variables to the actual .bru files
 * This ensures variables are available across all requests in the collection
 */

const fs = require('fs');
const path = require('path');

/**
 * Persist environment variable to the .bru environment file
 * @param {string} envName - Environment name (development, staging, production)
 * @param {string} key - Variable key
 * @param {string} value - Variable value
 * @returns {boolean} - Success status
 */
function persistEnvVar(envName, key, value) {
  try {
    const envFilePath = path.join(__dirname, '..', 'environments', `${envName}.bru`);
    
    if (!fs.existsSync(envFilePath)) {
      console.error(`Environment file not found: ${envFilePath}`);
      return false;
    }
    
    let content = fs.readFileSync(envFilePath, 'utf8');
    
    // Check if the variable already exists
    const existingVarRegex = new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'm');
    
    if (existingVarRegex.test(content)) {
      // Update existing variable
      content = content.replace(existingVarRegex, `  ${key}: ${value}`);
      console.log(`🔄 Updated existing variable: ${key}`);
    } else {
      // Add new variable before the closing brace
      const insertPosition = content.lastIndexOf('}');
      if (insertPosition === -1) {
        console.error('Could not find closing brace in environment file');
        return false;
      }
      
      const beforeBrace = content.substring(0, insertPosition);
      const afterBrace = content.substring(insertPosition);
      
      content = `${beforeBrace}  ${key}: ${value}\n${afterBrace}`;
      console.log(`➕ Added new variable: ${key}`);
    }
    
    fs.writeFileSync(envFilePath, content, 'utf8');
    console.log(`✅ Successfully persisted ${key} to ${envName}.bru`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error persisting ${key}:`, error.message);
    return false;
  }
}

/**
 * Persist multiple environment variables at once
 * @param {string} envName - Environment name
 * @param {Object} variables - Object with key-value pairs
 * @returns {Object} - Success status for each variable
 */
function persistEnvVars(envName, variables) {
  const results = {};
  
  for (const [key, value] of Object.entries(variables)) {
    results[key] = persistEnvVar(envName, key, value);
  }
  
  return results;
}

/**
 * Remove environment variable from the .bru file
 * @param {string} envName - Environment name
 * @param {string} key - Variable key to remove
 * @returns {boolean} - Success status
 */
function removeEnvVar(envName, key) {
  try {
    const envFilePath = path.join(__dirname, '..', 'environments', `${envName}.bru`);
    
    if (!fs.existsSync(envFilePath)) {
      console.error(`Environment file not found: ${envFilePath}`);
      return false;
    }
    
    let content = fs.readFileSync(envFilePath, 'utf8');
    
    // Remove the variable line
    const varRegex = new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:.*$\\n?`, 'm');
    
    if (varRegex.test(content)) {
      content = content.replace(varRegex, '');
      fs.writeFileSync(envFilePath, content, 'utf8');
      console.log(`🗑️  Removed variable: ${key}`);
      return true;
    } else {
      console.log(`⚠️  Variable not found: ${key}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error removing ${key}:`, error.message);
    return false;
  }
}

/**
 * Get all environment variables from a .bru file
 * @param {string} envName - Environment name
 * @returns {Object} - All variables as key-value pairs
 */
function getAllEnvVars(envName) {
  try {
    const envFilePath = path.join(__dirname, '..', 'environments', `${envName}.bru`);
    
    if (!fs.existsSync(envFilePath)) {
      console.error(`Environment file not found: ${envFilePath}`);
      return {};
    }
    
    const content = fs.readFileSync(envFilePath, 'utf8');
    const variables = {};
    
    // Extract variables from vars section
    const varsMatch = content.match(/vars\s*{([^}]+)}/);
    if (varsMatch) {
      const varsContent = varsMatch[1];
      const lines = varsContent.split('\n');
      
      lines.forEach(line => {
        const match = line.match(/^\s*([^:]+):\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          variables[key] = value;
        }
      });
    }
    
    return variables;
    
  } catch (error) {
    console.error(`❌ Error reading environment variables:`, error.message);
    return {};
  }
}

/**
 * Persist tokens from a login response
 * @param {string} envName - Environment name
 * @param {Object} responseData - The response data from login (accessToken, refreshToken, user, etc.)
 * @returns {Object} - Success status
 */
function persistLoginTokens(envName, responseData) {
  console.log(`📝 persistLoginTokens called with env: ${envName}, responseData keys: ${Object.keys(responseData)}`);
  
  const results = {};
  
  try {
    if (!responseData) {
      throw new Error('No response data provided');
    }
    
    // Extract tokens from response data
    const accessToken = responseData.accessToken || responseData.access_token;
    const refreshToken = responseData.refreshToken || responseData.refresh_token;
    const tokenExpiry = responseData.tokenExpiry || responseData.token_expiry;
    const refreshTokenExpiry = responseData.refreshTokenExpiry || responseData.refresh_token_expiry;
    
    console.log(`🔍 Extracted tokens: accessToken=${!!accessToken}, refreshToken=${!!refreshToken}, tokenExpiry=${!!tokenExpiry}, refreshTokenExpiry=${!!refreshTokenExpiry}`);
    
    if (accessToken) {
      results.accessToken = persistEnvVar(envName, 'actualuser.accessToken', accessToken);
      console.log(`✅ Persisted accessToken: ${results.accessToken}`);
    }
    
    if (refreshToken) {
      results.refreshToken = persistEnvVar(envName, 'actualuser.refreshToken', refreshToken);
      console.log(`✅ Persisted refreshToken: ${results.refreshToken}`);
    }
    
    // Calculate and store token expiry times
    if (accessToken && !tokenExpiry) {
      try {
        // Decode JWT to get expiry
        const payload = JSON.parse(atob(responseData.accessToken.split('.')[1]));
        const expiryTime = new Date(payload.exp * 1000).toISOString();
        results.tokenExpiry = persistEnvVar(envName, 'actualuser.tokenExpiry', expiryTime);
        console.log(`✅ Calculated and persisted tokenExpiry: ${results.tokenExpiry}`);
      } catch (e) {
        // Fallback: assume 15 minutes from now
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        results.tokenExpiry = persistEnvVar(envName, 'actualuser.tokenExpiry', expiryTime);
        console.log(`✅ Fallback tokenExpiry persisted: ${results.tokenExpiry}`);
      }
    } else if (tokenExpiry) {
      results.tokenExpiry = persistEnvVar(envName, 'actualuser.tokenExpiry', tokenExpiry);
      console.log(`✅ Persisted provided tokenExpiry: ${results.tokenExpiry}`);
    }
    
    if (refreshToken && !refreshTokenExpiry) {
      // Assume refresh token expires in 7 days
      const refreshExpiryTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      results.refreshTokenExpiry = persistEnvVar(envName, 'actualuser.refreshTokenExpiry', refreshExpiryTime);
      console.log(`✅ Calculated refreshTokenExpiry: ${results.refreshTokenExpiry}`);
    } else if (refreshTokenExpiry) {
      results.refreshTokenExpiry = persistEnvVar(envName, 'actualuser.refreshTokenExpiry', refreshTokenExpiry);
      console.log(`✅ Persisted provided refreshTokenExpiry: ${results.refreshTokenExpiry}`);
    }
    
    // Store user data if available
    if (responseData.user) {
      if (responseData.user.id) {
        results.userId = persistEnvVar(envName, 'actualuser.userId', responseData.user.id);
        console.log(`✅ Persisted userId: ${results.userId}`);
      }
      if (responseData.user.username) {
        results.username = persistEnvVar(envName, 'actualuser.username', responseData.user.username);
        console.log(`✅ Persisted username: ${results.username}`);
      }
      if (responseData.user.email) {
        results.email = persistEnvVar(envName, 'actualuser.email', responseData.user.email);
        console.log(`✅ Persisted email: ${results.email}`);
      }
    }
    
    console.log('✅ Login tokens persisted successfully');
    return results;
    
  } catch (error) {
    console.error('❌ Error persisting login tokens:', error.message);
    return results;
  }
}

/**
 * Clear all authentication-related variables
 * @param {string} envName - Environment name
 * @returns {Object} - Success status
 */
function clearAuthVars(envName) {
  const authVars = [
    'actualuser.accessToken',
    'actualuser.refreshToken', 
    'actualuser.tokenExpiry',
    'actualuser.refreshTokenExpiry',
    'actualuser.lastTokenRefresh'
  ];
  
  const results = {};
  authVars.forEach(varName => {
    results[varName] = removeEnvVar(envName, varName);
  });
  
  return results;
}

module.exports = {
  persistEnvVar,
  persistEnvVars,
  removeEnvVar,
  getAllEnvVars,
  persistLoginTokens,
  clearAuthVars
};