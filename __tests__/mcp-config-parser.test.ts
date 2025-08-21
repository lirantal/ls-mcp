import { test, describe } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { MCPConfigParser } from '../src/services/mcp-config-parser.js'

describe('MCPConfigParser', () => {
  describe('parseConfigFile', () => {
    test('should parse valid JSON file with servers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-servers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(result.parsed, true)
      assert.strictEqual(result.valid, true)
      assert.ok(result.raw)
      assert.strictEqual(Object.keys(result.servers).length, 2)
      assert.ok(result.servers['test-server'])
      assert.ok(result.servers['another-server'])
    })

    test('should parse valid JSON file with mcpServers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/claude-mcpServers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(result.parsed, true)
      assert.strictEqual(result.valid, true)
      assert.ok(result.raw)
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['claude-server'])
    })

    test('should parse valid JSON file with context_servers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/zed-context_servers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(result.parsed, true)
      assert.strictEqual(result.valid, true)
      assert.ok(result.raw)
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['zed-server'])
    })

    test('should parse valid JSON file with mcp.servers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-settings-mcp.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(result.parsed, true)
      assert.strictEqual(result.valid, true)
      assert.ok(result.raw)
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['global-server'])
    })

    test('should handle config file with mcpServers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(result.parsed, true)
      assert.strictEqual(result.valid, true)
      assert.ok(result.raw)
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['server-name'])
    })

    test('should throw error for invalid JSON file', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/invalid-json.jsonc')
      const parser = new MCPConfigParser(fixturePath)
      
      await assert.rejects(async () => {
        await parser.parseConfigFile()
      }, /Failed to parse configuration file/)
    })
  })

  describe('extractMCPServers', () => {
    test('should extract servers from servers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-servers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(Object.keys(result.servers).length, 2)
      assert.ok(result.servers['test-server'])
      assert.ok(result.servers['another-server'])
    })

    test('should extract servers from mcpServers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/claude-mcpServers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['claude-server'])
    })

    test('should extract servers from context_servers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/zed-context_servers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['zed-server'])
    })

    test('should extract servers from mcp.servers key', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-settings-mcp.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const result = await parser.parseConfigFile()
      
      assert.strictEqual(Object.keys(result.servers).length, 1)
      assert.ok(result.servers['global-server'])
    })
  })

  describe('validateServerConfig', () => {
    test('should validate valid server config', () => {
      const parser = new MCPConfigParser('dummy-path')
      const validConfig = {
        name: 'test-server',
        command: 'npx',
        args: ['test-mcp-server'],
        transport: 'stdio'
      }
      
      const isValid = parser.validateServerConfig(validConfig)
      assert.strictEqual(isValid, true)
    })

    test('should reject invalid server config without name', () => {
      const parser = new MCPConfigParser('dummy-path')
      const invalidConfig = {
        command: 'npx',
        args: ['test-mcp-server'],
        transport: 'stdio'
      }
      
      const isValid = parser.validateServerConfig(invalidConfig)
      assert.strictEqual(isValid, false)
    })

    test('should reject invalid server config without command', () => {
      const parser = new MCPConfigParser('dummy-path')
      const invalidConfig = {
        name: 'test-server',
        args: ['test-mcp-server'],
        transport: 'stdio'
      }
      
      const isValid = parser.validateServerConfig(invalidConfig)
      assert.strictEqual(isValid, false)
    })

    test('should reject null config', () => {
      const parser = new MCPConfigParser('dummy-path')
      const isValid = parser.validateServerConfig(null)
      assert.strictEqual(isValid, false)
    })
  })

  describe('getSupportedConfigKeys', () => {
    test('should return supported configuration keys', () => {
      const parser = new MCPConfigParser('dummy-path')
      const keys = parser.getSupportedConfigKeys()
      
      assert.ok(Array.isArray(keys))
      assert.ok(keys.includes('servers'))
      assert.ok(keys.includes('mcpServers'))
      assert.ok(keys.includes('context_servers'))
    })
  })

  describe('isValidSyntax', () => {
    test('should return true for valid JSON file', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-servers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const isValid = await parser.isValidSyntax()
      assert.strictEqual(isValid, true)
    })

    test('should return false for invalid JSON file', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/invalid-json.jsonc')
      const parser = new MCPConfigParser(fixturePath)
      
      const isValid = await parser.isValidSyntax()
      assert.strictEqual(isValid, false)
    })
  })

  describe('countMCPServers', () => {
    test('should count servers in valid config file', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp-config-service/vscode-servers.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const count = await parser.countMCPServers()
      assert.strictEqual(count, 2)
    })

    test('should return 1 for config file with mcpServers', async () => {
      const fixturePath = path.resolve('__tests__/__fixtures__/mcp.json')
      const parser = new MCPConfigParser(fixturePath)
      
      const count = await parser.countMCPServers()
      assert.strictEqual(count, 1)
    })
  })
})
