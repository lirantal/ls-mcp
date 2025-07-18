import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert'
import { RenderService } from '../src/services/render-service.ts'

describe('RenderService', () => {
  let originalConsoleLog: typeof console.log
  let logOutput: string[]

  beforeEach(() => {
    mock.reset()
    logOutput = []

    // Mock console.log to capture output
    originalConsoleLog = console.log
    console.log = (...args: any[]) => {
      logOutput.push(args.map(arg => String(arg)).join(' '))
    }
  })

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog
  })

  test('printMcpGroup outputs formatted group information', async (t) => {
    const groupData = [
      { key: 'PROVIDER', value: 'Claude Desktop' },
      { key: 'FILE', value: '/path/to/config.json' },
      { key: 'TYPE', value: 'GLOBAL' },
      { key: 'PARSABLE', value: 'VALID' }
    ]

    const groupMetadata = {
      mcpServersTotal: 3,
      mcpServersRunning: 1
    }

    RenderService.printMcpGroup(1, groupData, groupMetadata)

    // Should output the group information
    assert.ok(logOutput.length > 0)
    const output = logOutput.join('\n')

    // console.log(output)

    // Strip ANSI escape codes for testing
    const cleanOutput = output.replace(/\x1B\[[0-9;]*[JKmsu]/g, '')

    // Check for key components - the format might vary but these should be present
    assert.ok(cleanOutput.includes('1') || cleanOutput.includes('[1]'))
    assert.ok(cleanOutput.includes('PROVIDER'))
    assert.ok(cleanOutput.includes('Claude Desktop'))
    assert.ok(cleanOutput.includes('FILE'))
    assert.ok(cleanOutput.includes('/path/to/config.json'))
    assert.ok(cleanOutput.includes('TYPE'))
    assert.ok(cleanOutput.includes('GLOBAL'))
    assert.ok(cleanOutput.includes('PARSABLE'))
    // can't assert on `VALID` syntax because in a pretty output
    // we use an ANSI character with a symbol to indicate valid syntax
    // assert.ok(cleanOutput.includes('VALID'))
    assert.ok(cleanOutput.includes('1 / 3 Running'))
  })

  test('printMcpServers outputs server information', async (t) => {
    const servers = [
      {
        name: 'test-server',
        command: 'node',
        args: ['server.js'],
        env: { NODE_ENV: 'test' },
        status: 'running' as const,
        source: 'node server.js',
        transport: 'stdio' as const
      },
      {
        name: 'python-server',
        command: 'python',
        args: ['server.py'],
        env: {},
        status: 'stopped' as const,
        source: 'python server.py',
        transport: 'stdio' as const
      }
    ]

    RenderService.printMcpServers(servers)

    // Should output server information
    assert.ok(logOutput.length > 0)
    const output = logOutput.join('\n')
    assert.ok(output.includes('test-server'))
    assert.ok(output.includes('python-server'))
    assert.ok(output.includes('node server.js'))
    assert.ok(output.includes('python server.py'))
  })

  test('printMcpServers handles empty server list', async (t) => {
    RenderService.printMcpServers([])

    // Should handle empty list gracefully (implementation dependent)
    // At minimum, it shouldn't throw an error
    assert.ok(true) // Test passes if no error is thrown
  })

  test('printMcpGroup handles zero servers', async (t) => {
    const groupData = [
      { key: 'PROVIDER', value: 'Empty Provider' },
      { key: 'FILE', value: '/path/to/empty.json' },
      { key: 'TYPE', value: 'LOCAL' },
      { key: 'PARSABLE', value: 'VALID' }
    ]

    const groupMetadata = {
      mcpServersTotal: 0,
      mcpServersRunning: 0
    }

    RenderService.printMcpGroup(1, groupData, groupMetadata)

    const output = logOutput.join('\n')
    assert.ok(output.includes('0 / 0 Running'))
  })

  test('printMcpServers handles servers with different statuses', async (t) => {
    const servers = [
      {
        name: 'running-server',
        command: 'node',
        status: 'running' as const,
        source: 'node app.js',
        transport: 'stdio' as const
      },
      {
        name: 'stopped-server',
        command: 'python',
        status: 'stopped' as const,
        source: 'python app.py',
        transport: 'sse' as const
      }
    ]

    RenderService.printMcpServers(servers)

    const output = logOutput.join('\n')
    assert.ok(output.includes('running-server'))
    assert.ok(output.includes('stopped-server'))
  })

  // Cleanup after each test
  test.afterEach = () => {
    console.log = originalConsoleLog
  }
})
