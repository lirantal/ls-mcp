import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs/promises'
import { MCPFiles } from '../src/main.ts'

const execFileAsync = promisify(execFile)

describe('MCPFiles Class', () => {
  beforeEach(() => {
    // Reset the mocks before each test
    mock.reset()
  })

  test('constructor accepts custom file path groups', async (t) => {
    const customGroups = {
      test: {
        name: 'test',
        friendlyName: 'Test Group',
        paths: [
          {
            filePath: path.resolve('__tests__/__fixtures__/mcp.json'),
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    assert.ok(mcpFilesList.test)
    assert.strictEqual(mcpFilesList.test.name, 'test')
    assert.strictEqual(mcpFilesList.test.friendlyName, 'Test Group')
  })

  test('findFiles processes valid MCP configuration files', async (t) => {
    const testFixturePath = path.resolve('__tests__/__fixtures__/mcp.json')
    const customGroups = {
      test: {
        name: 'test',
        friendlyName: 'Test Group',
        paths: [
          {
            filePath: testFixturePath,
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    assert.ok(mcpFilesList.test)
    assert.strictEqual(mcpFilesList.test.paths.length, 1)
    assert.strictEqual(mcpFilesList.test.paths[0].parsable, true)
    assert.ok(mcpFilesList.test.paths[0].servers)
    assert.strictEqual(mcpFilesList.test.paths[0].servers.length, 1)
    assert.strictEqual(mcpFilesList.test.paths[0].servers[0].name, 'server-name')
  })

  test('findFiles handles non-existent files gracefully', async (t) => {
    const customGroups = {
      test: {
        name: 'test',
        friendlyName: 'Test Group',
        paths: [
          {
            filePath: '/path/that/does/not/exist.json',
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    assert.ok(mcpFilesList.test)
    assert.strictEqual(mcpFilesList.test.paths.length, 0)
  })

  test('findFiles handles multiple valid configuration files', async (t) => {
    const customGroups = {
      test: {
        name: 'test',
        friendlyName: 'Test Group',
        paths: [
          {
            filePath: path.resolve('__tests__/__fixtures__/mcp.json'),
            type: 'local' as const
          },
          {
            filePath: path.resolve('__tests__/__fixtures__/subdir/mcp2.json'),
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    assert.ok(mcpFilesList.test)
    assert.strictEqual(mcpFilesList.test.paths.length, 2)
    assert.ok(mcpFilesList.test.paths.every(path => path.parsable === true))
  })
})

describe('CLI Integration Tests', () => {
  const cliPath = path.resolve('dist/bin/cli.cjs')

  beforeEach(async () => {
    // Ensure the CLI is built
    try {
      await fs.access(cliPath)
    } catch {
      throw new Error('CLI not built. Run "npm run build" first.')
    }
  })

  test('CLI exits successfully when MCP configurations are found', async (t) => {
    // This test will run against the actual system MCP configurations
    // We expect it to succeed if any configurations are found
    try {
      const { stdout } = await execFileAsync('node', [cliPath], {
        timeout: 10000 // 10 second timeout
      })

      assert.ok(stdout.includes('[+] Detecting MCP Server configurations...'))
      assert.ok(stdout.includes('PROVIDER'))
    } catch (error: any) {
      // If exit code is 1, it means no configurations were found
      // This is acceptable behavior, not an error
      if (error.code === 1) {
        assert.ok(error.stdout.includes('[+] Detecting MCP Server configurations...'))
        assert.ok(error.stderr.includes('No MCP servers found') ||
                 error.stderr.includes('No configuration for MCP Server applications found'))
      } else {
        throw error
      }
    }
  })

  test('CLI handles invalid JSON gracefully', async (t) => {
    // Create a temporary invalid JSON file to test error handling
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-test-'))
    const invalidJsonPath = path.join(tempDir, 'invalid.json')

    try {
      await fs.writeFile(invalidJsonPath, 'completely invalid text not json at all')

      // Mock a configuration that points to our invalid file
      const customGroups = {
        test: {
          name: 'test',
          friendlyName: 'Test Group',
          paths: [
            {
              filePath: invalidJsonPath,
              type: 'local' as const
            }
          ]
        }
      }

      const mcpFilesManager = new MCPFiles(customGroups)
      const mcpFilesList = await mcpFilesManager.findFiles()

      // Should handle invalid JSON by marking file as non-parsable
      assert.ok(mcpFilesList.test)
      assert.strictEqual(mcpFilesList.test.paths.length, 1)
      assert.strictEqual(mcpFilesList.test.paths[0].parsable, false)
    } finally {
      // Cleanup
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('Configuration File Parsing', () => {
  test('parses Claude Desktop style configuration correctly', async (t) => {
    const customGroups = {
      claude: {
        name: 'claude',
        friendlyName: 'Claude Desktop',
        paths: [
          {
            filePath: path.resolve('__tests__/__fixtures__/mcp.json'),
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    const claudeConfig = mcpFilesList.claude
    assert.ok(claudeConfig)
    assert.strictEqual(claudeConfig.paths.length, 1)

    const servers = claudeConfig.paths[0].servers
    assert.ok(servers)
    assert.strictEqual(servers.length, 1)

    const server = servers[0]
    assert.strictEqual(server.name, 'server-name')
    assert.strictEqual(server.command, 'npx')
    assert.deepStrictEqual(server.args, ['-y', 'mcp-server'])
    assert.deepStrictEqual(server.env, { API_KEY: 'value' })
  })

  test('parses IntelliJ style configuration with comments', async (t) => {
    const customGroups = {
      intellij: {
        name: 'intellij',
        friendlyName: 'IntelliJ',
        paths: [
          {
            filePath: path.resolve('__tests__/__fixtures__/intellij-empty-with-comment.json'),
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    const intellijConfig = mcpFilesList.intellij
    assert.ok(intellijConfig)
    assert.strictEqual(intellijConfig.paths.length, 1)
    assert.strictEqual(intellijConfig.paths[0].parsable, true)
    // Should have empty servers array since the config has no servers
    const servers = intellijConfig.paths[0].servers
    assert.ok(servers)
    assert.strictEqual(servers.length, 0)
  })

  test('handles different server configurations correctly', async (t) => {
    const customGroups = {
      test: {
        name: 'test',
        friendlyName: 'Test Group',
        paths: [
          {
            filePath: path.resolve('__tests__/__fixtures__/subdir/mcp2.json'),
            type: 'local' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(customGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    const testConfig = mcpFilesList.test
    assert.ok(testConfig)
    assert.strictEqual(testConfig.paths.length, 1)

    const servers = testConfig.paths[0].servers
    assert.ok(servers)
    assert.strictEqual(servers.length, 1)

    const server = servers[0]
    assert.strictEqual(server.name, 'server-name')
    assert.strictEqual(server.command, 'python')
    assert.deepStrictEqual(server.args, ['mcp-server.py'])
    assert.deepStrictEqual(server.env, { API_KEY: 'value' })
  })
})
