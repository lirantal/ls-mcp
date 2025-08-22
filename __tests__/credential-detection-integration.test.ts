import { describe, it } from 'node:test'
import assert from 'node:assert'
import { CredentialDetectionService } from '../src/services/credential-detection-service.js'

describe('Credential Detection Integration', () => {
  it('should detect credentials in MCP server configuration with environment variables', () => {
    // Test the credential detection logic directly
    const env = {
      'FIRECRAWL_API_KEY': '12345',
      'OPENAI_API_KEY': 'sk-1234567890abcdef',
      'OPENAI_ORG_ID': 'org-1234567890',
      'NODE_ENV': 'production'
    }
    
    const credentials = CredentialDetectionService.analyzeEnvironmentVariables(env)
    
    // Should detect credentials
    assert.strictEqual(credentials.hasCredentials, true)
    assert.strictEqual(credentials.riskLevel, 'high')
    assert.strictEqual(credentials.credentialVars.length, 3)
    
    // Check that all credential variables are detected
    const credentialNames = credentials.credentialVars.map(cv => cv.name)
    assert.ok(credentialNames.includes('FIRECRAWL_API_KEY'))
    assert.ok(credentialNames.includes('OPENAI_API_KEY'))
    assert.ok(credentialNames.includes('OPENAI_ORG_ID'))
    
    // Check risk levels
    const firecrawlVar = credentials.credentialVars.find(cv => cv.name === 'FIRECRAWL_API_KEY')
    const openaiKeyVar = credentials.credentialVars.find(cv => cv.name === 'OPENAI_API_KEY')
    const openaiOrgVar = credentials.credentialVars.find(cv => cv.name === 'OPENAI_ORG_ID')
    
    assert.ok(firecrawlVar)
    assert.ok(openaiKeyVar)
    assert.ok(openaiOrgVar)
    
    assert.strictEqual(firecrawlVar.riskLevel, 'high')
    assert.strictEqual(openaiKeyVar.riskLevel, 'high')
    assert.strictEqual(openaiOrgVar.riskLevel, 'low')
  })

  it('should handle MCP servers without environment variables', () => {
    // Test with no env vars
    const credentials = CredentialDetectionService.analyzeEnvironmentVariables(undefined)
    assert.strictEqual(credentials.hasCredentials, false)
    assert.strictEqual(credentials.riskLevel, 'none')
    assert.strictEqual(credentials.credentialVars.length, 0)
    
    // Test with empty env vars
    const credentials2 = CredentialDetectionService.analyzeEnvironmentVariables({})
    assert.strictEqual(credentials2.hasCredentials, false)
    assert.strictEqual(credentials2.riskLevel, 'none')
    assert.strictEqual(credentials2.credentialVars.length, 0)
    
    // Test with non-credential env vars
    const credentials3 = CredentialDetectionService.analyzeEnvironmentVariables({
      'NODE_ENV': 'production',
      'DEBUG': 'true',
      'PORT': '3000'
    })
    assert.strictEqual(credentials3.hasCredentials, false)
    assert.strictEqual(credentials3.riskLevel, 'none')
    assert.strictEqual(credentials3.credentialVars.length, 0)
  })

  it('should properly mask sensitive values in credential variables', () => {
    const env = {
      'API_KEY': 'sk-1234567890abcdef',
      'ORG_ID': 'org-1234567890',
      'SECRET_KEY': 'ab'
    }
    
    const credentials = CredentialDetectionService.analyzeEnvironmentVariables(env)
    assert.ok(credentials.hasCredentials)
    
    // Check that the API key is properly masked
    const apiKeyVar = credentials.credentialVars.find(cv => cv.name === 'API_KEY')
    assert.ok(apiKeyVar, 'API key variable should exist')
    assert.strictEqual(apiKeyVar.value, 's********f') // First and last character with asterisks in between
    
    // Check that the org ID is properly masked
    const orgIdVar = credentials.credentialVars.find(cv => cv.name === 'ORG_ID')
    assert.ok(orgIdVar, 'Org ID variable should exist')
    assert.strictEqual(orgIdVar.value, 'o********0') // First and last character with asterisks in between
    
    // Check that short keys are not masked
    const shortKeyVar = credentials.credentialVars.find(cv => cv.name === 'SECRET_KEY')
    assert.ok(shortKeyVar, 'Short key variable should exist')
    assert.strictEqual(shortKeyVar.value, 'ab') // Too short to mask
  })
})
