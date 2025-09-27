import { describe, it } from 'node:test'
import assert from 'node:assert'
import { CredentialDetectionService, type CredentialAnalysisResult } from '../src/services/credential-detection-service.js'

describe('CredentialDetectionService', () => {
  describe('isPotentialCredential', () => {
    it('should detect API keys', () => {
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('API_KEY'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('api_key'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('API-KEY'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('OPENAI_API_KEY'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('FIRECRAWL_API_KEY'), true)
    })

    it('should detect generic key and token patterns', () => {
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('VERCEL_TOKEN'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('AWS_KEY'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('MY_APP_KEY'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('SERVICE_TOKEN'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('RANDOM_SECRET_KEY'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('CUSTOM_ACCESS_TOKEN'), true)
    })

    it('should detect tokens', () => {
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('API_TOKEN'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('ACCESS_TOKEN'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('AUTH_TOKEN'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('GITHUB_TOKEN'), true)
    })

    it('should detect passwords', () => {
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('PASSWORD'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('DB_PASSWORD'), true)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('REDIS_PASSWORD'), true)
    })

    it('should not detect non-credential variables', () => {
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('NODE_ENV'), false)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('PORT'), false)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('DEBUG'), false)
      assert.strictEqual(CredentialDetectionService.isPotentialCredential('LOG_LEVEL'), false)
    })
  })

  describe('analyzeEnvironmentVariables', () => {
    it('should return no credentials for undefined env', () => {
      const result = CredentialDetectionService.analyzeEnvironmentVariables(undefined)
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should return no credentials for empty env', () => {
      const result = CredentialDetectionService.analyzeEnvironmentVariables({})
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should detect single credential variable', () => {
      const env = {
        'FIRECRAWL_API_KEY': '12345',
        'NODE_ENV': 'production'
      }
      
      const result = CredentialDetectionService.analyzeEnvironmentVariables(env)
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 1)
      assert.strictEqual(result.credentialVars[0].name, 'FIRECRAWL_API_KEY')
      assert.strictEqual(result.credentialVars[0].value, '1***5')
      assert.strictEqual(result.credentialVars[0].riskLevel, 'high')
      assert.strictEqual(result.riskLevel, 'high')
    })

    it('should detect multiple credential variables', () => {
      const env = {
        'OPENAI_API_KEY': 'sk-1234567890abcdef',
        'OPENAI_ORG_ID': 'org-1234567890',
        'NODE_ENV': 'production'
      }
      
      const result = CredentialDetectionService.analyzeEnvironmentVariables(env)
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 2)
      assert.strictEqual(result.riskLevel, 'high')
    })

    it('should mask sensitive values appropriately', () => {
      const env = {
        'API_KEY': 'ab',
        'SECRET_KEY': '12345',
        'ACCESS_TOKEN': 'very-long-secret-key-value'
      }
      
      const result = CredentialDetectionService.analyzeEnvironmentVariables(env)
      assert.strictEqual(result.credentialVars.length, 3)
      assert.strictEqual(result.credentialVars[0].value, 'ab') // Too short to mask
      assert.strictEqual(result.credentialVars[1].value, '1***5') // Medium length
      assert.strictEqual(result.credentialVars[2].value, 'v********e') // Long length, max 8 asterisks
    })

    it('should assess risk levels correctly', () => {
      const env = {
        'API_KEY': 'secret', // High risk
        'AUTH_TOKEN': 'token', // High risk (was medium, now high)
        'ORG_ID': 'org123', // Low risk
        'DEBUG_MODE': 'true' // Not a credential
      }
      
      const result = CredentialDetectionService.analyzeEnvironmentVariables(env)
      assert.strictEqual(result.credentialVars.length, 3)
      
      const apiKeyVar = result.credentialVars.find(v => v.name === 'API_KEY')
      const authTokenVar = result.credentialVars.find(v => v.name === 'AUTH_TOKEN')
      const orgIdVar = result.credentialVars.find(v => v.name === 'ORG_ID')
      
      assert.strictEqual(apiKeyVar?.riskLevel, 'high')
      assert.strictEqual(authTokenVar?.riskLevel, 'high') // Now high instead of medium
      assert.strictEqual(orgIdVar?.riskLevel, 'low')
      assert.strictEqual(result.riskLevel, 'high') // Overall risk should be high
    })

    it('should skip variable substitution patterns in environment variables', () => {
      const env = {
        'GITHUB_PERSONAL_ACCESS_TOKEN': '${input:github_token}',
        'API_KEY': '${env:API_KEY}',
        'REAL_TOKEN': 'sk-1234567890abcdef' // This should be detected
      }
      
      const result = CredentialDetectionService.analyzeEnvironmentVariables(env)
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 1) // Only the REAL_TOKEN
      assert.strictEqual(result.credentialVars[0].name, 'REAL_TOKEN')
      assert.strictEqual(result.credentialVars[0].riskLevel, 'high')
    })
  })

  describe('isVariableSubstitution', () => {
    it('should detect variable substitution patterns', () => {
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('${input:github_mcp_pat}'), true)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('${env:API_KEY}'), true)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('${config:token}'), true)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('${secret:key}'), true)
    })

    it('should not detect plain text as variable substitution', () => {
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('plain-text-token'), false)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('sk-1234567890abcdef'), false)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('Bearer token123'), false)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('${incomplete'), false)
      assert.strictEqual(CredentialDetectionService.isVariableSubstitution('incomplete}'), false)
    })
  })

  describe('analyzeArguments', () => {
    it('should return no credentials for undefined args', () => {
      const result = CredentialDetectionService.analyzeArguments(undefined)
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should return no credentials for empty args', () => {
      const result = CredentialDetectionService.analyzeArguments([])
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should detect API key arguments', () => {
      const args = ['-y', '@upstash/context7-mcp', '--api-key', 'TOKEN123']
      const result = CredentialDetectionService.analyzeArguments(args)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 1)
      assert.strictEqual(result.credentialVars[0].name, '--api-key')
      assert.strictEqual(result.credentialVars[0].value, 'T******3')
      assert.strictEqual(result.credentialVars[0].riskLevel, 'high')
      assert.strictEqual(result.credentialVars[0].source, 'args')
      assert.strictEqual(result.riskLevel, 'high')
    })

    it('should detect multiple credential arguments', () => {
      const args = ['command', '--api-key', 'key123', '--password', 'secret456', '--org-id', 'org789']
      const result = CredentialDetectionService.analyzeArguments(args)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 3)
      
      const apiKeyVar = result.credentialVars.find(v => v.name === '--api-key')
      const passwordVar = result.credentialVars.find(v => v.name === '--password')
      const orgIdVar = result.credentialVars.find(v => v.name === '--org-id')
      
      assert.strictEqual(apiKeyVar?.riskLevel, 'high')
      assert.strictEqual(passwordVar?.riskLevel, 'high')
      assert.strictEqual(orgIdVar?.riskLevel, 'low')
      assert.strictEqual(result.riskLevel, 'high')
    })

    it('should handle various argument patterns', () => {
      const args = ['--token', 'abc123', '--auth', 'def456', '--secret', 'ghi789']
      const result = CredentialDetectionService.analyzeArguments(args)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 3)
      result.credentialVars.forEach(v => {
        assert.strictEqual(v.riskLevel, 'high')
        assert.strictEqual(v.source, 'args')
      })
    })

    it('should not detect non-credential arguments', () => {
      const args = ['--help', '--version', '--port', '3000', '--verbose']
      const result = CredentialDetectionService.analyzeArguments(args)
      
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should handle arguments without values', () => {
      const args = ['--api-key'] // No value after the flag
      const result = CredentialDetectionService.analyzeArguments(args)
      
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should handle flag-like values', () => {
      const args = ['--api-key', '--another-flag'] // Next arg is also a flag
      const result = CredentialDetectionService.analyzeArguments(args)
      
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })
  })

  describe('analyzeHeaders', () => {
    it('should return no credentials for undefined headers', () => {
      const result = CredentialDetectionService.analyzeHeaders(undefined)
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should detect Authorization header with plain text', () => {
      const headers = {
        'Authorization': 'Bearer sk-1234567890abcdef',
        'Content-Type': 'application/json'
      }
      const result = CredentialDetectionService.analyzeHeaders(headers)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 1)
      assert.strictEqual(result.credentialVars[0].name, 'Authorization')
      assert.strictEqual(result.credentialVars[0].value, 'B********f')
      assert.strictEqual(result.credentialVars[0].riskLevel, 'high')
      assert.strictEqual(result.credentialVars[0].source, 'headers')
    })

    it('should skip variable substitution in headers', () => {
      const headers = {
        'Authorization': '${input:github_mcp_pat}',
        'X-API-Key': '${env:API_KEY}'
      }
      const result = CredentialDetectionService.analyzeHeaders(headers)
      
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should detect multiple credential headers', () => {
      const headers = {
        'Authorization': 'Bearer token123',
        'X-API-Key': 'key456',
        'X-Auth-Token': 'auth789',
        'X-Org-ID': 'org123',
        'Content-Type': 'application/json'
      }
      const result = CredentialDetectionService.analyzeHeaders(headers)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 4)
      
      const authVar = result.credentialVars.find(v => v.name === 'Authorization')
      const apiKeyVar = result.credentialVars.find(v => v.name === 'X-API-Key')
      const authTokenVar = result.credentialVars.find(v => v.name === 'X-Auth-Token')
      const orgIdVar = result.credentialVars.find(v => v.name === 'X-Org-ID')
      
      assert.strictEqual(authVar?.riskLevel, 'high')
      assert.strictEqual(apiKeyVar?.riskLevel, 'high')
      assert.strictEqual(authTokenVar?.riskLevel, 'high')
      assert.strictEqual(orgIdVar?.riskLevel, 'low')
      assert.strictEqual(result.riskLevel, 'high')
    })

    it('should handle mixed safe and unsafe headers', () => {
      const headers = {
        'Authorization': '${input:token}', // Safe - variable substitution
        'X-API-Key': 'real-key-123',      // Unsafe - plain text
        'Content-Type': 'application/json'
      }
      const result = CredentialDetectionService.analyzeHeaders(headers)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 1)
      assert.strictEqual(result.credentialVars[0].name, 'X-API-Key')
      assert.strictEqual(result.credentialVars[0].riskLevel, 'high')
    })
  })

  describe('analyzeServerConfig', () => {
    it('should combine analysis from all sources', () => {
      const config = {
        env: { 'API_KEY': 'env-key-123' },
        args: ['--token', 'arg-token-456'],
        headers: { 'Authorization': 'Bearer header-auth-789' }
      }
      const result = CredentialDetectionService.analyzeServerConfig(config)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 3)
      
      const envVar = result.credentialVars.find(v => v.source === 'env')
      const argsVar = result.credentialVars.find(v => v.source === 'args')
      const headersVar = result.credentialVars.find(v => v.source === 'headers')
      
      assert.strictEqual(envVar?.name, 'API_KEY')
      assert.strictEqual(argsVar?.name, '--token')
      assert.strictEqual(headersVar?.name, 'Authorization')
      assert.strictEqual(result.riskLevel, 'high')
    })

    it('should handle empty config', () => {
      const result = CredentialDetectionService.analyzeServerConfig({})
      
      assert.strictEqual(result.hasCredentials, false)
      assert.strictEqual(result.credentialVars.length, 0)
      assert.strictEqual(result.riskLevel, 'none')
    })

    it('should prioritize highest risk level', () => {
      const config = {
        env: { 'ORG_ID': 'org123' }, // Low risk
        headers: { 'Authorization': '${input:token}' } // Safe - should be ignored
      }
      const result = CredentialDetectionService.analyzeServerConfig(config)
      
      assert.strictEqual(result.hasCredentials, true)
      assert.strictEqual(result.credentialVars.length, 1)
      assert.strictEqual(result.riskLevel, 'low')
    })
  })
})
