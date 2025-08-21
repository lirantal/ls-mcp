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
        'AUTH_TOKEN': 'token', // Medium risk
        'DEBUG_MODE': 'true' // Not a credential
      }
      
      const result = CredentialDetectionService.analyzeEnvironmentVariables(env)
      assert.strictEqual(result.credentialVars.length, 2)
      
      const apiKeyVar = result.credentialVars.find(v => v.name === 'API_KEY')
      const authTokenVar = result.credentialVars.find(v => v.name === 'AUTH_TOKEN')
      
      assert.strictEqual(apiKeyVar?.riskLevel, 'high')
      assert.strictEqual(authTokenVar?.riskLevel, 'medium')
      assert.strictEqual(result.riskLevel, 'high') // Overall risk should be high
    })
  })
})
