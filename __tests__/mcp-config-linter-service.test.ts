import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import fs from 'node:fs/promises'
import { MCPConfigLinterService } from '../src/services/mcp-config-linter-service.ts'

describe('MCPConfigLinterService', () => {
  beforeEach(() => {
    mock.reset()
  })

  test('isValidSyntax returns true for valid JSON with comments', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/intellij-empty-with-comment.json')
    const linter = new MCPConfigLinterService(configPath)

    const isValid = await linter.isValidSyntax()
    assert.strictEqual(isValid, true)
  })

  test('isValidSyntax returns true for valid MCP server configuration', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/mcp.json')
    const linter = new MCPConfigLinterService(configPath)

    const isValid = await linter.isValidSyntax()
    assert.strictEqual(isValid, true)
  })

  test('isValidSyntax returns false for invalid JSON', async (t) => {
    // Create a temporary invalid JSON file
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-test-'))
    const invalidJsonPath = path.join(tempDir, 'invalid.json')

    try {
      await fs.writeFile(invalidJsonPath, 'completely invalid text not json at all')

      const linter = new MCPConfigLinterService(invalidJsonPath)
      const isValid = await linter.isValidSyntax()
      assert.strictEqual(isValid, false)
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  test('isValidSyntax returns false for non-existent file', async (t) => {
    const linter = new MCPConfigLinterService('/path/that/does/not/exist.json')
    const isValid = await linter.isValidSyntax()
    assert.strictEqual(isValid, false)
  })

  test('getMCPServers returns correct server configuration', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/mcp.json')
    const linter = new MCPConfigLinterService(configPath)

    const servers = await linter.getMCPServers()

    assert.ok(servers['server-name'])
    const server = servers['server-name'] as any
    assert.strictEqual(server.command, 'npx')
    assert.deepStrictEqual(server.args, ['-y', 'mcp-server'])
    assert.deepStrictEqual(server.env, { API_KEY: 'value' })
  })

  test('getMCPServers handles IntelliJ format with servers key', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/intellij-empty-with-comment.json')
    const linter = new MCPConfigLinterService(configPath)

    const servers = await linter.getMCPServers()

    // IntelliJ format uses "servers" key and currently has no servers configured
    assert.deepStrictEqual(servers, {})
  })

  test('getMCPServers handles different configuration formats', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/subdir/mcp2.json')
    const linter = new MCPConfigLinterService(configPath)

    const servers = await linter.getMCPServers()

    assert.ok(servers['server-name'])
    const server = servers['server-name'] as any
    assert.strictEqual(server.command, 'python')
    assert.deepStrictEqual(server.args, ['mcp-server.py'])
  })

  test('countMCPServers returns correct count', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/mcp.json')
    const linter = new MCPConfigLinterService(configPath)

    const count = await linter.countMCPServers()
    assert.strictEqual(count, 1)
  })

  test('countMCPServers returns zero for empty configuration', async (t) => {
    const configPath = path.resolve('__tests__/__fixtures__/intellij-empty-with-comment.json')
    const linter = new MCPConfigLinterService(configPath)

    const count = await linter.countMCPServers()
    assert.strictEqual(count, 0)
  })

  test('countMCPServers returns zero for invalid file', async (t) => {
    const linter = new MCPConfigLinterService('/path/that/does/not/exist.json')
    const count = await linter.countMCPServers()
    assert.strictEqual(count, 0)
  })
})
