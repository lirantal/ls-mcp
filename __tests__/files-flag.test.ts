import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLI_PATH = path.resolve(__dirname, '../dist/bin/cli.cjs')

describe('--files flag', () => {
  it('should parse single file with mcpServers key', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-mcpservers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    assert.strictEqual(Object.keys(result.mcpFiles).length, 1)
    assert.ok(result.mcpFiles.custom)
    assert.strictEqual(result.mcpFiles.custom.friendlyName, 'Custom Files')
    assert.strictEqual(result.mcpFiles.custom.paths.length, 1)
    assert.strictEqual(result.mcpFiles.custom.paths[0].parsable, true)
    assert.strictEqual(result.mcpFiles.custom.paths[0].servers.length, 2)
    assert.strictEqual(result.summary.totalServers, 2)
  })

  it('should parse single file with servers key', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    assert.strictEqual(Object.keys(result.mcpFiles).length, 1)
    assert.ok(result.mcpFiles.custom)
    assert.strictEqual(result.mcpFiles.custom.paths[0].servers.length, 2)
    assert.strictEqual(result.summary.totalServers, 2)
  })

  it('should parse multiple files with comma-separated syntax', async () => {
    const config1 = path.resolve(__dirname, 'test-configs/custom-mcpservers.json')
    const config2 = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${config1},${config2} --json`)
    const result = JSON.parse(stdout)

    assert.strictEqual(Object.keys(result.mcpFiles).length, 1)
    assert.ok(result.mcpFiles.custom)
    assert.strictEqual(result.mcpFiles.custom.paths.length, 2)
    assert.strictEqual(result.summary.totalServers, 4)
  })

  it('should parse multiple files with space-separated syntax', async () => {
    const config1 = path.resolve(__dirname, 'test-configs/custom-mcpservers.json')
    const config2 = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${config1} ${config2} --json`)
    const result = JSON.parse(stdout)

    assert.strictEqual(Object.keys(result.mcpFiles).length, 1)
    assert.ok(result.mcpFiles.custom)
    assert.strictEqual(result.mcpFiles.custom.paths.length, 2)
    assert.strictEqual(result.summary.totalServers, 4)
  })

  it('should handle non-existent files gracefully', async () => {
    const nonExistentPath = path.resolve(__dirname, 'test-configs/non-existent.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${nonExistentPath} --json`)
    const result = JSON.parse(stdout)

    assert.ok(result.mcpFiles.custom)
    assert.strictEqual(result.mcpFiles.custom.paths.length, 1)
    assert.strictEqual(result.mcpFiles.custom.paths[0].parsable, false)
    assert.strictEqual(result.mcpFiles.custom.paths[0].servers.length, 0)
    assert.strictEqual(result.summary.totalServers, 0)
  })

  it('should replace automatic discovery when --files is used', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    // Should only have 'custom' provider, not 'cursor', 'vscode', etc.
    const providers = Object.keys(result.mcpFiles)
    assert.strictEqual(providers.length, 1)
    assert.strictEqual(providers[0], 'custom')
  })

  it('should work with --json flag', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    assert.ok(result.mcpFiles)
    assert.ok(result.summary)
    assert.ok(result.summary.totalServers !== undefined)
    assert.ok(result.summary.runningServers !== undefined)
    assert.ok(result.summary.transportBreakdown)
  })

  it('should detect server details correctly', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-mcpservers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    const servers = result.mcpFiles.custom.paths[0].servers
    
    // Check first server
    assert.strictEqual(servers[0].name, 'test-server-1')
    assert.strictEqual(servers[0].command, 'node')
    assert.deepStrictEqual(servers[0].args, ['./server.js'])
    assert.strictEqual(servers[0].transport, 'stdio')
    
    // Check second server with credentials
    assert.strictEqual(servers[1].name, 'test-server-2')
    assert.strictEqual(servers[1].command, 'python')
    assert.ok(servers[1].credentials.hasCredentials)
    assert.strictEqual(servers[1].credentials.riskLevel, 'high')
  })

  it('should show friendly console output without --json', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath}`)

    assert.ok(stdout.includes('Custom Files'))
    assert.ok(stdout.includes('PROVIDER'))
    assert.ok(stdout.includes('SUMMARY'))
  })

  it('should detect version information', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    const anotherServer = result.mcpFiles.custom.paths[0].servers.find(
      (s: any) => s.name === 'another-server'
    )
    
    assert.ok(anotherServer)
    assert.ok(anotherServer.versionInfo)
    assert.strictEqual(anotherServer.versionInfo.packageName, '@modelcontextprotocol/server-filesystem')
    assert.strictEqual(anotherServer.versionInfo.isLatest, true)
    assert.strictEqual(anotherServer.versionInfo.isPinned, false)
  })

  it('should extract hostname from SSE/HTTP servers', async () => {
    const configPath = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configPath} --json`)
    const result = JSON.parse(stdout)

    const httpServer = result.mcpFiles.custom.paths[0].servers.find(
      (s: any) => s.name === 'http-server'
    )
    
    assert.ok(httpServer)
    assert.strictEqual(httpServer.source, 'api.example.com')
    assert.strictEqual(httpServer.transport, 'sse')
  })
})
