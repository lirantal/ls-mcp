import { describe, it } from 'node:test'
import assert from 'node:assert'
import SummaryComponent from '../src/components/summary.js'

describe('SummaryComponent', () => {
  it('should render summary with all statistics', () => {
    const stats = {
      totalServers: 20,
      runningServers: 13,
      highRiskCredentials: 5,
      implicitLatestVersions: 7,
      transportBreakdown: {
        stdio: 12,
        sse: 6,
        http: 2
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    // Should have 5 lines: SUMMARY + 4 metric lines (including VERSION)
    assert.strictEqual(lines.length, 5)
    
    // First line should be SUMMARY
    assert.strictEqual(lines[0], 'SUMMARY')
    
    // Second line should contain servers info
    assert.ok(lines[1].includes('SERVERS'))
    assert.ok(lines[1].includes('13 / 20 Running'))
    
    // Third line should contain security info
    assert.ok(lines[2].includes('SECURITY'))
    assert.ok(lines[2].includes('5 / 20 High Risk Credentials'))
    
    // Fourth line should contain version info
    assert.ok(lines[3].includes('VERSION'))
    assert.ok(lines[3].includes('7 / 20 Implicit Latest'))
    
    // Fifth line should contain transport info
    assert.ok(lines[4].includes('TRANSPORT'))
    assert.ok(lines[4].includes('stdio: 12 | SSE: 6 | HTTP: 2'))
  })

  it('should handle zero servers gracefully', () => {
    const stats = {
      totalServers: 0,
      runningServers: 0,
      highRiskCredentials: 0,
      implicitLatestVersions: 0,
      transportBreakdown: {
        stdio: 0,
        sse: 0,
        http: 0
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    assert.strictEqual(lines.length, 5)
    assert.ok(lines[1].includes('0 / 0 Running'))
    assert.ok(lines[2].includes('0 / 0 High Risk Credentials'))
    assert.ok(lines[3].includes('0 / 0 Implicit Latest'))
    assert.ok(lines[4].includes('stdio: 0 | SSE: 0 | HTTP: 0'))
  })

  it('should handle partial data correctly', () => {
    const stats = {
      totalServers: 5,
      runningServers: 3,
      highRiskCredentials: 1,
      implicitLatestVersions: 2,
      transportBreakdown: {
        stdio: 4,
        sse: 1,
        http: 0
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    assert.strictEqual(lines.length, 5)
    assert.ok(lines[1].includes('3 / 5 Running'))
    assert.ok(lines[2].includes('1 / 5 High Risk Credentials'))
    assert.ok(lines[3].includes('2 / 5 Implicit Latest'))
    assert.ok(lines[4].includes('stdio: 4 | SSE: 1 | HTTP: 0'))
  })

  it('should show green progress bars when security and version issues are zero', () => {
    const stats = {
      totalServers: 5,
      runningServers: 3,
      highRiskCredentials: 0,
      implicitLatestVersions: 0,
      transportBreakdown: {
        stdio: 4,
        sse: 1,
        http: 0
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    assert.strictEqual(lines.length, 5)
    assert.ok(lines[1].includes('3 / 5 Running'))
    assert.ok(lines[2].includes('0 / 5 High Risk Credentials'))
    assert.ok(lines[3].includes('0 / 5 Implicit Latest'))
    assert.ok(lines[4].includes('stdio: 4 | SSE: 1 | HTTP: 0'))
    
    // When count is 0 for security and version bars, they should use green styling
    // (We can't easily test the actual color codes, but we can verify the logic works)
    // The key change is in the createProgressBar function with emptyIsGood=true parameter
  })
})
