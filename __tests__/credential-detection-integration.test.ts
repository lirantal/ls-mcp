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

  it('should detect credentials in arguments similar to context7 example', () => {
    // Test the exact case from the user's example
    const args = ['-y', '@upstash/context7-mcp', '--api-key', 'TOKEN']
    
    const credentials = CredentialDetectionService.analyzeArguments(args)
    
    assert.strictEqual(credentials.hasCredentials, true)
    assert.strictEqual(credentials.riskLevel, 'high')
    assert.strictEqual(credentials.credentialVars.length, 1)
    
    const credVar = credentials.credentialVars[0]
    assert.strictEqual(credVar.name, '--api-key')
    assert.strictEqual(credVar.value, 'T***N') // TOKEN masked
    assert.strictEqual(credVar.riskLevel, 'high')
    assert.strictEqual(credVar.source, 'args')
  })

  it('should detect credentials in HTTP headers with variable substitution handling', () => {
    // Test case with mix of safe and unsafe headers
    const headers = {
      'Authorization': '${input:github_mcp_pat}', // Safe - variable substitution
      'X-API-Key': 'real-api-key-123', // Unsafe - plain text
      'Content-Type': 'application/json' // Not a credential
    }
    
    const credentials = CredentialDetectionService.analyzeHeaders(headers)
    
    assert.strictEqual(credentials.hasCredentials, true)
    assert.strictEqual(credentials.riskLevel, 'high')
    assert.strictEqual(credentials.credentialVars.length, 1) // Only the unsafe one
    
    const credVar = credentials.credentialVars[0]
    assert.strictEqual(credVar.name, 'X-API-Key')
    assert.strictEqual(credVar.value, 'r********3') // real-api-key-123 masked
    assert.strictEqual(credVar.riskLevel, 'high')
    assert.strictEqual(credVar.source, 'headers')
  })

  it('should handle comprehensive server config with all credential types', () => {
    // Test a complete MCP server configuration with credentials in all places
    const serverConfig = {
      env: {
        'OPENAI_API_KEY': 'sk-1234567890abcdef',
        'OPENAI_ORG_ID': 'org-1234567890',
        'NODE_ENV': 'production' // Not a credential
      },
      args: [
        'npx', '-y', '@upstash/context7-mcp',
        '--api-key', 'context7-token-123',
        '--org-id', 'ctx7-org-456'
      ],
      headers: {
        'Authorization': 'Bearer github-pat-xyz789',
        'X-Custom-Key': '${env:CUSTOM_KEY}', // Safe - variable substitution
        'Content-Type': 'application/json' // Not a credential
      }
    }
    
    const credentials = CredentialDetectionService.analyzeServerConfig(serverConfig)
    
    assert.strictEqual(credentials.hasCredentials, true)
    assert.strictEqual(credentials.riskLevel, 'high')
    assert.strictEqual(credentials.credentialVars.length, 5)
    
    // Check each source has the right number of credentials
    const envVars = credentials.credentialVars.filter(v => v.source === 'env')
    const argVars = credentials.credentialVars.filter(v => v.source === 'args')
    const headerVars = credentials.credentialVars.filter(v => v.source === 'headers')
    
    assert.strictEqual(envVars.length, 2) // OPENAI_API_KEY, OPENAI_ORG_ID
    assert.strictEqual(argVars.length, 2) // --api-key, --org-id
    assert.strictEqual(headerVars.length, 1) // Authorization (X-Custom-Key is safe)
    
    // Verify risk levels
    const highRiskVars = credentials.credentialVars.filter(v => v.riskLevel === 'high')
    const lowRiskVars = credentials.credentialVars.filter(v => v.riskLevel === 'low')
    
    assert.strictEqual(highRiskVars.length, 3) // OPENAI_API_KEY, --api-key, Authorization
    assert.strictEqual(lowRiskVars.length, 2) // OPENAI_ORG_ID, --org-id
  })

  it('should handle edge cases with empty or missing data', () => {
    // Test completely empty config
    const emptyConfig = {}
    const credentials1 = CredentialDetectionService.analyzeServerConfig(emptyConfig)
    
    assert.strictEqual(credentials1.hasCredentials, false)
    assert.strictEqual(credentials1.riskLevel, 'none')
    assert.strictEqual(credentials1.credentialVars.length, 0)
    
    // Test config with all empty arrays/objects
    const emptyArraysConfig = {
      env: {},
      args: [],
      headers: {}
    }
    const credentials2 = CredentialDetectionService.analyzeServerConfig(emptyArraysConfig)
    
    assert.strictEqual(credentials2.hasCredentials, false)
    assert.strictEqual(credentials2.riskLevel, 'none')
    assert.strictEqual(credentials2.credentialVars.length, 0)
  })
})
