#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

/**
 * Environment Manager for Bruno Collection
 * Manages environment variables with request/response tracking and persistence
 */
class EnvironmentManager {
  private collectionPath: string;
  private envFilePath: string;
  private backupDir: string;

  constructor(collectionPath: string = '.', environment: string = 'development') {
    this.collectionPath = path.resolve(collectionPath);
    this.envFilePath = path.join(this.collectionPath, 'environments', `${environment}.bru`);
    this.backupDir = path.join(this.collectionPath, 'backups');
  }

  /**
   * Initialize environment manager
   */
  async initialize(): Promise<void> {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Create environment backup
    if (fs.existsSync(this.envFilePath)) {
      await this.createBackup();
    }

    console.log('🚀 Environment Manager initialized');
  }

  /**
   * Create backup of current environment file
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `environment-backup-${timestamp}.bru`);
    
    fs.copyFileSync(this.envFilePath, backupPath);
    console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  }

  /**
   * Store response data with proper persistence
   */
  async storeResponseData(requestName: string, responseData: any): Promise<void> {
    try {
      const envContent = this.parseEnvironmentFile();
      const timestamp = new Date().toISOString();

      // Store response data with request tracking
      const responseVars = {
        [`${requestName}.lastResponseTime`]: timestamp,
        [`${requestName}.lastResponseStatus`]: responseData.status || 'unknown',
        [`${requestName}.responseData`]: JSON.stringify(responseData),
      };

      // Add specific response fields if they exist
      if (responseData.data) {
        if (responseData.data.token) {
          responseVars[`${requestName}.accessToken`] = responseData.data.token;
        }
        if (responseData.data.refreshToken) {
          responseVars[`${requestName}.refreshToken`] = responseData.data.refreshToken;
        }
        if (responseData.data.user) {
          responseVars[`${requestName}.userData`] = JSON.stringify(responseData.data.user);
        }
      }

      // Update environment variables
      await this.updateEnvironmentVariables(responseVars, true); // persist = true

      console.log(`✅ Response data stored for: ${requestName}`);
    } catch (error) {
      console.error(`❌ Error storing response data:`, error);
      throw error;
    }
  }

  /**
   * Store request data for tracking
   */
  async storeRequestData(requestName: string, requestData: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      const requestVars = {
        [`${requestName}.lastRequestTime`]: timestamp,
        [`${requestName}.requestData`]: JSON.stringify(requestData),
      };

      // Update environment variables (non-persistent for request data)
      await this.updateEnvironmentVariables(requestVars, false); // persist = false

      console.log(`✅ Request data stored for: ${requestName}`);
    } catch (error) {
      console.error(`❌ Error storing request data:`, error);
      throw error;
    }
  }

  /**
   * Update environment variables
   */
  private async updateEnvironmentVariables(vars: Record<string, string>, persist: boolean = false): Promise<void> {
    const envContent = this.parseEnvironmentFile();
    
    // Update vars section
    for (const [key, value] of Object.entries(vars)) {
      envContent.vars[key] = value;
    }

    // Write updated content back to file
    await this.writeEnvironmentFile(envContent);

    // Log persistence status
    if (persist) {
      console.log(`💾 Persisted ${Object.keys(vars).length} variables`);
    } else {
      console.log(`📊 Stored ${Object.keys(vars).length} temporary variables`);
    }
  }

  /**
   * Parse environment file content
   */
  private parseEnvironmentFile(): { vars: Record<string, string>; secretVars: string[] } {
    if (!fs.existsSync(this.envFilePath)) {
      throw new Error(`Environment file not found: ${this.envFilePath}`);
    }

    const content = fs.readFileSync(this.envFilePath, 'utf8');
    const vars: Record<string, string> = {};
    const secretVars: string[] = [];

    let currentSection = '';
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('vars {')) {
        currentSection = 'vars';
        continue;
      } else if (trimmedLine.startsWith('vars:secret [')) {
        currentSection = 'secret';
        continue;
      } else if (trimmedLine === '}' || trimmedLine === ']') {
        currentSection = '';
        continue;
      }

      if (currentSection === 'vars' && trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        vars[key.trim()] = value;
      } else if (currentSection === 'secret' && trimmedLine) {
        const secretKey = trimmedLine.replace(/[,\s]/g, '');
        if (secretKey) {
          secretVars.push(secretKey);
        }
      }
    }

    return { vars, secretVars };
  }

  /**
   * Write environment file content
   */
  private async writeEnvironmentFile(content: { vars: Record<string, string>; secretVars: string[] }): Promise<void> {
    let output = 'vars {\n';
    
    for (const [key, value] of Object.entries(content.vars)) {
      output += `  ${key}: ${value}\n`;
    }
    
    output += '}\n\nvars:secret [';
    
    if (content.secretVars.length > 0) {
      output += '\n';
      for (const secret of content.secretVars) {
        output += `  ${secret},\n`;
      }
      output = output.slice(0, -2); // Remove last comma
      output += '\n';
    }
    
    output += ']';

    fs.writeFileSync(this.envFilePath, output, 'utf8');
  }

  /**
   * Get environment variable
   */
  getVariable(key: string): string | undefined {
    try {
      const content = this.parseEnvironmentFile();
      return content.vars[key];
    } catch (error) {
      console.error(`❌ Error getting variable ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set environment variable
   */
  async setVariable(key: string, value: string, persist: boolean = false): Promise<void> {
    try {
      await this.updateEnvironmentVariables({ [key]: value }, persist);
      console.log(`✅ Variable set: ${key}`);
    } catch (error) {
      console.error(`❌ Error setting variable ${key}:`, error);
      throw error;
    }
  }

  /**
   * List all environment variables
   */
  listVariables(): void {
    try {
      const content = this.parseEnvironmentFile();
      console.log('\n📋 Environment Variables:');
      console.log('======================');
      
      for (const [key, value] of Object.entries(content.vars)) {
        const isSecret = content.secretVars.includes(key);
        const displayValue = isSecret ? '***' : value;
        console.log(`${key}: ${displayValue} ${isSecret ? '(secret)' : ''}`);
      }
      
      console.log(`\nTotal variables: ${Object.keys(content.vars).length}`);
      console.log(`Secret variables: ${content.secretVars.length}`);
    } catch (error) {
      console.error(`❌ Error listing variables:`, error);
    }
  }

  /**
   * Clean up old request/response data
   */
  async cleanupOldData(olderThanHours: number = 24): Promise<void> {
    try {
      const content = this.parseEnvironmentFile();
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      let cleanedCount = 0;
      const cleanedVars: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(content.vars)) {
        // Check if this is a request/response timestamp
        if (key.includes('.last') && key.includes('Time')) {
          try {
            const timestamp = new Date(value);
            if (timestamp < cutoffTime) {
              // Remove related request/response data
              const prefix = key.split('.')[0];
              Object.keys(content.vars).forEach(varKey => {
                if (varKey.startsWith(prefix + '.')) {
                  delete content.vars[varKey];
                  cleanedCount++;
                }
              });
            }
          } catch (error) {
            // Not a valid timestamp, keep the variable
            cleanedVars[key] = value;
          }
        } else {
          cleanedVars[key] = value;
        }
      }
      
      await this.writeEnvironmentFile({ vars: cleanedVars, secretVars: content.secretVars });
      console.log(`🧹 Cleaned up ${cleanedCount} old variables`);
    } catch (error) {
      console.error(`❌ Error during cleanup:`, error);
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔧 Environment Manager CLI

Usage:
  npm run env-manager <command> [options]

Commands:
  store-response <request-name> <json-file>   Store response data from JSON file
  store-request <request-name> <json-file>    Store request data from JSON file
  set <key> <value> [persist]                 Set environment variable
  get <key>                                   Get environment variable
  list                                        List all variables
  cleanup [hours]                           Clean up old data (default: 24h)
  help                                        Show this help

Examples:
  npm run env-manager store-response login response.json
  npm run env-manager set actualuser.accessToken "eyJ..." true
  npm run env-manager get actualuser.username
  npm run env-manager list
  npm run env-manager cleanup 48
`);
    return;
  }

  const command = args[0];
  const manager = new EnvironmentManager();
  await manager.initialize();

  try {
    switch (command) {
      case 'store-response':
        if (args.length < 3) {
          console.error('❌ Usage: store-response <request-name> <json-file>');
          return;
        }
        const responseData = JSON.parse(fs.readFileSync(args[2], 'utf8'));
        await manager.storeResponseData(args[1], responseData);
        break;

      case 'store-request':
        if (args.length < 3) {
          console.error('❌ Usage: store-request <request-name> <json-file>');
          return;
        }
        const requestData = JSON.parse(fs.readFileSync(args[2], 'utf8'));
        await manager.storeRequestData(args[1], requestData);
        break;

      case 'set':
        if (args.length < 3) {
          console.error('❌ Usage: set <key> <value> [persist]');
          return;
        }
        const persist = args[3] === 'true' || args[3] === '1';
        await manager.setVariable(args[1], args[2], persist);
        break;

      case 'get':
        if (args.length < 2) {
          console.error('❌ Usage: get <key>');
          return;
        }
        const value = manager.getVariable(args[1]);
        console.log(value || 'undefined');
        break;

      case 'list':
        manager.listVariables();
        break;

      case 'cleanup':
        const hours = args[1] ? parseInt(args[1]) : 24;
        await manager.cleanupOldData(hours);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "npm run env-manager help" for usage information.');
    }
  } catch (error) {
    console.error(`❌ Command failed:`, error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { EnvironmentManager };