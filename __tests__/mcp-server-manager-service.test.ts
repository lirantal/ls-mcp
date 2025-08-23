import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { MCPServerManagerService } from '../src/services/mcp-server-manager-service.ts'

describe('MCPServerManagerService', () => {
  beforeEach(() => {
    mock.reset()
  })

  test('constructor initializes with correct server configuration', async (t) => {
    const serverConfig = {
      name: 'test-server',
      command: 'node',
      args: ['server.js'],
      env: { NODE_ENV: 'test' },
      transport: 'stdio' as const
    }

    const manager = new MCPServerManagerService(serverConfig)

    assert.strictEqual(manager.getName(), 'test-server')
    assert.strictEqual(manager.getCmd(), 'node')
    assert.deepStrictEqual(manager.getArgs(), ['server.js'])
    assert.deepStrictEqual(manager.getEnv(), { NODE_ENV: 'test' })
    assert.strictEqual(manager.getTransport(), 'stdio')
  })

  test('constructor handles minimal server configuration', async (t) => {
    const serverConfig = {
      name: 'minimal-server',
      command: 'python'
    }

    const manager = new MCPServerManagerService(serverConfig)

    assert.strictEqual(manager.getName(), 'minimal-server')
    assert.strictEqual(manager.getCmd(), 'python')
    assert.deepStrictEqual(manager.getArgs(), [])
    assert.deepStrictEqual(manager.getEnv(), {})
  })

  test('constructor handles server configuration with URL', async (t) => {
    const serverConfig = {
      name: 'web-server',
      command: '',
      url: 'http://localhost:3000/mcp'
    }

    const manager = new MCPServerManagerService(serverConfig)

    assert.strictEqual(manager.getName(), 'web-server')
    // Transport should be set to 'http' internally when URL is provided
    assert.strictEqual(manager.getTransport(), 'http')
  })

  test('getSource returns command and args when available', async (t) => {
    const serverConfig = {
      name: 'test-server',
      command: 'npx',
      args: ['-y', 'mcp-server']
    }

    const manager = new MCPServerManagerService(serverConfig)
    const source = manager.getSource()

    assert.strictEqual(source, 'npx -y mcp-server')
  })

  test('getSource returns only command when no args', async (t) => {
    const serverConfig = {
      name: 'test-server',
      command: 'python'
    }

    const manager = new MCPServerManagerService(serverConfig)
    const source = manager.getSource()

    assert.strictEqual(source, 'python')
  })

  test('getSource returns hostname when URL is available', async (t) => {
    const serverConfig = {
      name: 'web-server',
      command: '',
      url: 'http://localhost:3000/mcp'
    }

    const manager = new MCPServerManagerService(serverConfig)
    const source = manager.getSource()

    assert.strictEqual(source, 'localhost')
  })

  test('isRunning returns false for non-existent processes', async (t) => {
    const serverConfig = {
      name: 'non-existent-server',
      command: 'definitely-not-a-real-command-that-exists'
    }

    const manager = new MCPServerManagerService(serverConfig)
    const isRunning = manager.isRunning()

    // Should return false since this command doesn't exist
    assert.strictEqual(isRunning, false)
  })

  test('handles different transport types correctly', async (t) => {
    const configs = [
      { name: 'stdio-server', command: 'node', transport: 'stdio' as const },
      { name: 'sse-server', command: 'node', transport: 'sse' as const }
    ]

    for (const config of configs) {
      const manager = new MCPServerManagerService(config)
      assert.strictEqual(manager.getTransport(), config.transport)
    }

    // Test URL-based configuration which sets transport to 'http' internally
    const urlConfig = {
      name: 'http-server',
      command: 'node',
      url: 'http://localhost:3000'
    }
    const urlManager = new MCPServerManagerService(urlConfig)
    assert.strictEqual(urlManager.getTransport(), 'http')
  })

  test('handles streamable-http type correctly', async (t) => {
    // Test that streamable-http type is mapped to http transport
    const streamableHttpConfig = {
      name: 'streamable-http-server',
      command: 'node',
      type: 'streamable-http' as const
    }
    const streamableHttpManager = new MCPServerManagerService(streamableHttpConfig)
    assert.strictEqual(streamableHttpManager.getTransport(), 'http', 'streamable-http should map to http transport')

    // Test that regular http type still works
    const httpConfig = {
      name: 'http-server',
      command: 'node',
      type: 'http' as const
    }
    const httpManager = new MCPServerManagerService(httpConfig)
    assert.strictEqual(httpManager.getTransport(), 'http', 'http type should map to http transport')
  })

  test('handles undefined values gracefully', async (t) => {
    const serverConfig = {
      name: 'test-server',
      command: 'node',
      args: undefined,
      env: undefined,
      transport: undefined
    }

    const manager = new MCPServerManagerService(serverConfig)

    assert.strictEqual(manager.getName(), 'test-server')
    assert.strictEqual(manager.getCmd(), 'node')
    assert.deepStrictEqual(manager.getArgs(), [])
    assert.deepStrictEqual(manager.getEnv(), {})
  })
})
