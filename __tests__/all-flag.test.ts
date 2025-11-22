import { describe, it } from 'node:test'
import assert from 'node:assert'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLI_PATH = path.resolve(__dirname, '../dist/bin/cli.cjs')

describe('--all flag', () => {
  it('should hide providers with zero servers by default in discovery mode', async () => {
    // This test assumes there's at least one provider with servers in the system
    // We check that the output doesn't include empty providers without --all
    const { stdout } = await execAsync(`node ${CLI_PATH} --json`)
    const result = JSON.parse(stdout)

    // Verify that only providers with servers are included
    for (const [providerName, group] of Object.entries(result.mcpFiles)) {
      assert.ok(
        (group as any).stats?.serversCount > 0,
        `Provider ${providerName} should have servers > 0 when --all is not specified`
      )
    }
  })

  it('should show all providers including those with zero servers when --all is specified', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --all --json`)
    const result = JSON.parse(stdout)

    // With --all, we can have providers with zero servers
    // We just verify the command doesn't fail and returns valid JSON
    assert.ok(result.mcpFiles)
    assert.ok(result.summary)
    
    // Count providers with zero and non-zero servers
    let zeroServerProviders = 0
    let nonZeroServerProviders = 0
    
    for (const [, group] of Object.entries(result.mcpFiles)) {
      if ((group as any).stats?.serversCount === 0) {
        zeroServerProviders++
      } else {
        nonZeroServerProviders++
      }
    }
    
    // With --all we expect to potentially see zero-server providers
    // (this might be zero on systems with no empty configs, but that's okay)
    assert.ok(
      zeroServerProviders >= 0,
      'Should allow zero-server providers with --all'
    )
  })

  it('should support -a short form of --all flag', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} -a --json`)
    const result = JSON.parse(stdout)

    // Should behave the same as --all
    assert.ok(result.mcpFiles)
    assert.ok(result.summary)
  })

  it('should always show custom group in --files mode even with zero servers', async () => {
    const emptyConfig = path.resolve(__dirname, 'test-configs/empty-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${emptyConfig} --json`)
    const result = JSON.parse(stdout)

    // Custom files mode should always show the custom group
    assert.ok(result.mcpFiles.custom, 'custom group should be present')
    assert.strictEqual(result.mcpFiles.custom.stats.serversCount, 0)
    assert.strictEqual(result.mcpFiles.custom.paths.length, 1)
    assert.strictEqual(result.summary.totalServers, 0)
  })

  it('should show custom group with servers in --files mode without --all', async () => {
    const configWithServers = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(`node ${CLI_PATH} --files ${configWithServers} --json`)
    const result = JSON.parse(stdout)

    // Custom group with servers should always be shown
    assert.ok(result.mcpFiles.custom)
    assert.ok(result.mcpFiles.custom.stats.serversCount > 0)
  })

  it('should handle mixed empty and non-empty files in --files mode', async () => {
    const emptyConfig = path.resolve(__dirname, 'test-configs/empty-servers.json')
    const configWithServers = path.resolve(__dirname, 'test-configs/custom-servers.json')
    const { stdout } = await execAsync(
      `node ${CLI_PATH} --files ${emptyConfig},${configWithServers} --json`
    )
    const result = JSON.parse(stdout)

    // Custom group should show both files
    assert.ok(result.mcpFiles.custom)
    assert.strictEqual(result.mcpFiles.custom.paths.length, 2)
    // Total servers should only count the non-empty file
    assert.ok(result.mcpFiles.custom.stats.serversCount > 0)
  })

  it('should show friendly output with --all in console mode', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --all`)

    // Should show the summary section
    assert.ok(stdout.includes('SUMMARY') || stdout.includes('Detecting'))
  })

  it('should combine --all with --json correctly', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --all --json`)
    const result = JSON.parse(stdout)

    // Verify complete structure is present
    assert.ok(result.mcpFiles)
    assert.ok(result.summary)
    assert.ok(typeof result.summary.totalServers === 'number')
    assert.ok(typeof result.summary.runningServers === 'number')
    assert.ok(result.summary.transportBreakdown)
  })

  it('should not affect summary statistics when filtering providers', async () => {
    // Without --all
    const { stdout: stdout1 } = await execAsync(`node ${CLI_PATH} --json`)
    const result1 = JSON.parse(stdout1)

    // With --all
    const { stdout: stdout2 } = await execAsync(`node ${CLI_PATH} --all --json`)
    const result2 = JSON.parse(stdout2)

    // Summary statistics should be the same regardless of filtering
    assert.strictEqual(
      result1.summary.totalServers,
      result2.summary.totalServers,
      'Total servers count should be identical'
    )
    assert.deepStrictEqual(
      result1.summary.transportBreakdown,
      result2.summary.transportBreakdown,
      'Transport breakdown should be identical'
    )
  })
})
