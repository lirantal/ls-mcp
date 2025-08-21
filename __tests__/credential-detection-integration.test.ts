import { describe, it } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { MCPConfigParser } from '../src/services/mcp-config-parser.js'

describe('Credential Detection Integration', () => {
  it('should detect credentials in MCP server configuration with environment variables', async () => {
    const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/claude-mcpServers.json')
    const parser = new MCPConfigParser(fixturePath)
    
    const result = await parser.parseConfigFile()
    
    // Should have 3 servers
    assert.strictEqual(Object.keys(result.servers).length, 3)
    
    // Check claude-server (no credentials)
    const claudeServer = result.servers['claude-server']
    assert.ok(claudeServer)
    assert.strictEqual(claudeServer.credentials?.hasCredentials, false)
    
    // Check firecrawl-mcp (has credentials)
    const firecrawlServer = result.servers['firecrawl-mcp']
    assert.ok(firecrawlServer)
    assert.strictEqual(firecrawlServer.credentials?.hasCredentials, true)
    assert.strictEqual(firecrawlServer.credentials?.riskLevel, 'high')
    assert.strictEqual(firecrawlServer.credentials?.credentialVars.length, 1)
    assert.strictEqual(firecrawlServer.credentials?.credentialVars[0].name, 'FIRECRAWL_API_KEY')
    assert.strictEqual(firecrawlServer.credentials?.credentialVars[0].riskLevel, 'high')
    
    // Check openai-mcp (has credentials)
    const openaiServer = result.servers['openai-mcp']
    assert.ok(openaiServer)
    assert.strictEqual(openaiServer.credentials?.hasCredentials, true)
    assert.strictEqual(openaiServer.credentials?.riskLevel, 'high')
    assert.strictEqual(openaiServer.credentials?.credentialVars.length, 2)
    
    // Check that both credential variables are detected
    const credentialNames = openaiServer.credentials?.credentialVars.map(cv => cv.name) || []
    assert.ok(credentialNames.includes('OPENAI_API_KEY'))
    assert.ok(credentialNames.includes('OPENAI_ORG_ID'))
    
    // Check that OPENAI_API_KEY is high risk and OPENAI_ORG_ID is low risk
    const apiKeyVar = openaiServer.credentials?.credentialVars.find(cv => cv.name === 'OPENAI_API_KEY')
    const orgIdVar = openaiServer.credentials?.credentialVars.find(cv => cv.name === 'OPENAI_ORG_ID')
    assert.strictEqual(apiKeyVar?.riskLevel, 'high')
    assert.strictEqual(orgIdVar?.riskLevel, 'low')
  })

  it('should handle MCP servers without environment variables', async () => {
    const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-servers.json')
    const parser = new MCPConfigParser(fixturePath)
    
    const result = await parser.parseConfigFile()
    
    // Should have 2 servers
    assert.strictEqual(Object.keys(result.servers).length, 2)
    
    // Check that both servers have no credentials
    for (const server of Object.values(result.servers)) {
      assert.strictEqual(server.credentials?.hasCredentials, false)
      assert.strictEqual(server.credentials?.riskLevel, 'none')
      assert.strictEqual(server.credentials?.credentialVars.length, 0)
    }
  })

  it('should properly mask sensitive values in credential variables', async () => {
    const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/claude-mcpServers.json')
    const parser = new MCPConfigParser(fixturePath)
    
    const result = await parser.parseConfigFile()
    const openaiServer = result.servers['openai-mcp']
    
    assert.ok(openaiServer.credentials?.hasCredentials)
    
    // Check that the API key is properly masked
    const apiKeyVar = openaiServer.credentials?.credentialVars.find(cv => cv.name === 'OPENAI_API_KEY')
    assert.ok(apiKeyVar)
    assert.strictEqual(apiKeyVar.value, 's********f') // First and last character with asterisks in between
    
    // Check that the org ID is properly masked
    const orgIdVar = openaiServer.credentials?.credentialVars.find(cv => cv.name === 'OPENAI_ORG_ID')
    assert.ok(orgIdVar)
    assert.strictEqual(orgIdVar.value, 'o********0') // First and last character with asterisks in between
  })
})
