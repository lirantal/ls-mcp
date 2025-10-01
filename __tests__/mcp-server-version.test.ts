import { test, describe } from 'node:test'
import assert from 'node:assert'
import MCPServerVersionComponent from '../src/components/mcp-server-version.js'
import type { PackageVersionInfo } from '../src/types/mcp-config-service.types.js'

describe('MCPServerVersionComponent', () => {
  test('should return empty string for undefined versionInfo', () => {
    const result = MCPServerVersionComponent(undefined)
    assert.strictEqual(result, '')
  })

  test('should display pinned version with green circle', () => {
    const versionInfo: PackageVersionInfo = {
      packageName: 'test-package',
      version: '1.2.3',
      isPinned: true,
      isLatest: false
    }
    
    const result = MCPServerVersionComponent(versionInfo)
    // Should contain green circle and version
    assert.ok(result.includes('1.2.3'))
    assert.ok(result.includes('●'))
  })

  test('should display LATEST with red circle for latest version', () => {
    const versionInfo: PackageVersionInfo = {
      packageName: 'test-package',
      version: undefined,
      isPinned: false,
      isLatest: true
    }
    
    const result = MCPServerVersionComponent(versionInfo)
    // Should contain red circle and LATEST
    assert.ok(result.includes('LATEST'))
    assert.ok(result.includes('●'))
  })

  test('should display LATEST for explicit latest version', () => {
    const versionInfo: PackageVersionInfo = {
      packageName: 'test-package',
      version: 'latest',
      isPinned: false,
      isLatest: true
    }
    
    const result = MCPServerVersionComponent(versionInfo)
    // Should contain red circle and LATEST
    assert.ok(result.includes('LATEST'))
    assert.ok(result.includes('●'))
  })

  test('should display complex version numbers correctly', () => {
    const versionInfo: PackageVersionInfo = {
      packageName: 'test-package',
      version: '^1.2.3',
      isPinned: true,
      isLatest: false
    }
    
    const result = MCPServerVersionComponent(versionInfo)
    // Should contain green circle and version
    assert.ok(result.includes('^1.2.3'))
    assert.ok(result.includes('●'))
  })

  test('should display beta versions correctly', () => {
    const versionInfo: PackageVersionInfo = {
      packageName: 'test-package',
      version: '2.0.0-beta.1',
      isPinned: true,
      isLatest: false
    }
    
    const result = MCPServerVersionComponent(versionInfo)
    // Should contain green circle and version
    assert.ok(result.includes('2.0.0-beta.1'))
    assert.ok(result.includes('●'))
  })
})
