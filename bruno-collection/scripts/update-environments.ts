#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Environment Updater for Bruno Collection
 * Synchronizes environment variables from .env files with Bruno environments
 */
class EnvironmentUpdater {
  private collectionPath: string;
  private projectRoot: string;

  constructor(collectionPath: string = '.') {
    this.collectionPath = path.resolve(collectionPath);
    this.projectRoot = path.resolve(collectionPath, '..');
  }

  /**
   * Update all environment files
   */
  async updateEnvironments(): Promise<void> {
    console.log('🔄 Updating Bruno environments...');

    try {
      // Load environment variables from .env files
      const envVars = await this.loadEnvironmentVariables();
      
      // Update each environment file
      await this.updateEnvironmentFile('development', envVars.development || {});
      await this.updateEnvironmentFile('staging', envVars.staging || {});
      await this.updateEnvironmentFile('production', envVars.production || {});
      
      console.log('✅ All environments updated successfully!');
    } catch (error) {
      console.error('❌ Error updating environments:', error);
      process.exit(1);
    }
  }

  /**
   * Load environment variables from .env files
   */
  private async loadEnvironmentVariables(): Promise<{
    development: Record<string, string>;
    staging: Record<string, string>;
    production: Record<string, string>;
  }> {
    const environments = {
      development: {} as Record<string, string>,
      staging: {} as Record<string, string>,
      production: {} as Record<string, string>
    };

    // Load main .env file
    const mainEnvPath = path.join(this.projectRoot, '.env');
    if (fs.existsSync(mainEnvPath)) {
      try {
        const mainEnv = dotenv.parse(fs.readFileSync(mainEnvPath, 'utf8'));
        if (mainEnv) {
          // Merge into development environment
          for (const [key, value] of Object.entries(mainEnv)) {
            environments.development[key] = value;
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not parse ${mainEnvPath}:`, error);
      }
    }

    // Load environment-specific files
    const envFiles = [
      { name: 'development' as const, file: '.env.development' },
      { name: 'staging' as const, file: '.env.staging' },
      { name: 'production' as const, file: '.env.production' }
    ];

    for (const { name, file } of envFiles) {
      const envPath = path.join(this.projectRoot, file);
      if (fs.existsSync(envPath)) {
        try {
          const envData = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
          if (envData) {
            // Merge environment-specific variables
            for (const [key, value] of Object.entries(envData)) {
              environments[name][key] = value;
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not parse ${envPath}:`, error);
        }
      }
    }

    return environments;
  }

  /**
   * Update a specific environment file
   */
  private async updateEnvironmentFile(envName: string, envVars: Record<string, string>): Promise<void> {
    const envFilePath = path.join(this.collectionPath, 'environments', `${envName}.bru`);
    
    if (!fs.existsSync(envFilePath)) {
      console.log(`⚠️ Environment file not found: ${envName}.bru`);
      return;
    }

    let content = fs.readFileSync(envFilePath, 'utf8');
    
    // Update variables section
    const varsSection = this.generateVarsSection(envVars, envName);
    
    // Replace the vars section
    content = content.replace(
      /vars\s*{[^}]*}/s,
      varsSection
    );

    fs.writeFileSync(envFilePath, content, 'utf8');
    console.log(`📝 Updated ${envName} environment`);
  }

  /**
   * Generate vars section for Bruno environment file
   */
  private generateVarsSection(envVars: Record<string, string>, envName: string): string {
    const baseUrl = envVars.API_URL || envVars.BASE_URL || 'http://localhost:3000';
    const apiVersion = envVars.API_VERSION || 'v1';
    
    return `vars {
  baseUrl: ${baseUrl}
  apiVersion: ${apiVersion}
  environment: ${envName}
  timeout: ${envVars.REQUEST_TIMEOUT || '30000'}
  retryAttempts: ${envVars.RETRY_ATTEMPTS || '3'}
  logLevel: ${envVars.LOG_LEVEL || 'info'}
}`;
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironments(): Promise<void> {
    console.log('🔍 Validating environments...');

    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      const envPath = path.join(this.collectionPath, 'environments', `${env}.bru`);
      
      if (!fs.existsSync(envPath)) {
        console.error(`❌ Missing environment file: ${env}.bru`);
        continue;
      }

      const content = fs.readFileSync(envPath, 'utf8');
      
      // Check for required variables
      const requiredVars = ['baseUrl', 'apiVersion', 'environment'];
      const missingVars = requiredVars.filter(varName => !content.includes(`${varName}:`));
      
      if (missingVars.length > 0) {
        console.error(`❌ Missing variables in ${env}: ${missingVars.join(', ')}`);
      } else {
        console.log(`✅ ${env} environment is valid`);
      }
    }
  }

  /**
   * Create environment template
   */
  async createEnvironmentTemplate(envName: string): Promise<void> {
    const templateContent = `vars {
  baseUrl: http://localhost:3000
  apiVersion: v1
  environment: ${envName}
  timeout: 30000
  retryAttempts: 3
  logLevel: info
}

vars:secret [
  accessToken,
  refreshToken,
  supabaseAnonKey,
  supabaseServiceRoleKey
]`;

    const envPath = path.join(this.collectionPath, 'environments', `${envName}.bru`);
    const envDir = path.dirname(envPath);
    
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }

    fs.writeFileSync(envPath, templateContent, 'utf8');
    console.log(`📄 Created ${envName} environment template`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'update';
  
  const updater = new EnvironmentUpdater();
  
  switch (command) {
    case 'update':
      await updater.updateEnvironments();
      break;
    case 'validate':
      await updater.validateEnvironments();
      break;
    case 'create':
      const envName = args[1];
      if (!envName) {
        console.error('❌ Please specify environment name');
        process.exit(1);
      }
      await updater.createEnvironmentTemplate(envName);
      break;
    default:
      console.log('Usage: npm run update-env [update|validate|create <env-name>]');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { EnvironmentUpdater };