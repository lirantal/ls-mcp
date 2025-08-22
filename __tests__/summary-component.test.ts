import { describe, it } from 'node:test'
import assert from 'node:assert'
import SummaryComponent from '../src/components/summary.js'

describe('SummaryComponent', () => {
  it('should render summary with all statistics', () => {
    const stats = {
      totalServers: 20,
      runningServers: 13,
      highRiskCredentials: 5,
      transportBreakdown: {
        stdio: 12,
        sse: 6,
        http: 2
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    // Should have 4 lines: SUMMARY + 3 metric lines
    assert.strictEqual(lines.length, 4)
    
    // First line should be SUMMARY
    assert.strictEqual(lines[0], 'SUMMARY')
    
    // Second line should contain servers info
    assert.ok(lines[1].includes('SERVERS'))
    assert.ok(lines[1].includes('13 / 20 Running'))
    
    // Third line should contain security info
    assert.ok(lines[2].includes('SECURITY'))
    assert.ok(lines[2].includes('5 / 20 High Risk Credentials'))
    
    // Fourth line should contain transport info
    assert.ok(lines[3].includes('TRANSPORT'))
    assert.ok(lines[3].includes('stdio: 12 | SSE: 6 | HTTP: 2'))
  })

  it('should handle zero servers gracefully', () => {
    const stats = {
      totalServers: 0,
      runningServers: 0,
      highRiskCredentials: 0,
      transportBreakdown: {
        stdio: 0,
        sse: 0,
        http: 0
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    assert.strictEqual(lines.length, 4)
    assert.ok(lines[1].includes('0 / 0 Running'))
    assert.ok(lines[2].includes('0 / 0 High Risk Credentials'))
    assert.ok(lines[3].includes('stdio: 0 | SSE: 0 | HTTP: 0'))
  })

  it('should handle partial data correctly', () => {
    const stats = {
      totalServers: 5,
      runningServers: 3,
      highRiskCredentials: 1,
      transportBreakdown: {
        stdio: 4,
        sse: 1,
        http: 0
      }
    }

    const output = SummaryComponent(stats)
    const lines = output.split('\n')

    assert.strictEqual(lines.length, 4)
    assert.ok(lines[1].includes('3 / 5 Running'))
    assert.ok(lines[2].includes('1 / 5 High Risk Credentials'))
    assert.ok(lines[3].includes('stdio: 4 | SSE: 1 | HTTP: 0'))
  })
})
