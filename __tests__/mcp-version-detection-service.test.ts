import { test, describe } from 'node:test'
import assert from 'node:assert'
import { MCPVersionDetectionService } from '../src/services/mcp-version-detection-service.js'

describe('MCPVersionDetectionService', () => {
  let service: MCPVersionDetectionService

  test.beforeEach(() => {
    service = new MCPVersionDetectionService()
  })

  describe('analyzeServerVersion', () => {
    test('should detect pinned version with -y flag', () => {
      const result = service.analyzeServerVersion('npx', ['-y', 'mcp-server-nodejs-api-docs@1.1.3'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: '1.1.3',
        isPinned: true,
        isLatest: false
      })
    })

    test('should detect latest version with -y flag', () => {
      const result = service.analyzeServerVersion('npx', ['-y', 'mcp-server-nodejs-api-docs'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: undefined,
        isPinned: false,
        isLatest: true
      })
    })

    test('should detect pinned version without -y flag', () => {
      const result = service.analyzeServerVersion('npx', ['mcp-server-nodejs-api-docs@1.1.3'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: '1.1.3',
        isPinned: true,
        isLatest: false
      })
    })

    test('should detect latest version without -y flag', () => {
      const result = service.analyzeServerVersion('npx', ['mcp-server-nodejs-api-docs'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: undefined,
        isPinned: false,
        isLatest: true
      })
    })

    test('should return null for non-npx commands', () => {
      const result = service.analyzeServerVersion('docker', ['run', 'image'])
      assert.strictEqual(result, null)
    })

    test('should return null for empty args array', () => {
      const result = service.analyzeServerVersion('npx', [])
      assert.strictEqual(result, null)
    })

    test('should return null for undefined args', () => {
      const result = service.analyzeServerVersion('npx', undefined)
      assert.strictEqual(result, null)
    })

    test('should ignore npx options starting with -', () => {
      const result = service.analyzeServerVersion('npx', ['-q', '-y', 'mcp-server-nodejs-api-docs'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: undefined,
        isPinned: false,
        isLatest: true
      })
    })

    test('should handle --yes flag', () => {
      const result = service.analyzeServerVersion('npx', ['--yes', 'mcp-server-nodejs-api-docs@2.0.0'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: '2.0.0',
        isPinned: true,
        isLatest: false
      })
    })

    test('should detect @latest as not pinned', () => {
      const result = service.analyzeServerVersion('npx', ['-y', 'mcp-server-nodejs-api-docs@latest'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-nodejs-api-docs',
        version: 'latest',
        isPinned: false,
        isLatest: true
      })
    })

    test('should handle scoped packages without version', () => {
      const result = service.analyzeServerVersion('npx', ['-y', '@upstash/context7-mcp'])
      
      assert.deepStrictEqual(result, {
        packageName: '@upstash/context7-mcp',
        version: undefined,
        isPinned: false,
        isLatest: true
      })
    })

    test('should handle scoped packages with version', () => {
      const result = service.analyzeServerVersion('npx', ['-y', '@upstash/context7-mcp@1.0.0'])
      
      assert.deepStrictEqual(result, {
        packageName: '@upstash/context7-mcp',
        version: '1.0.0',
        isPinned: true,
        isLatest: false
      })
    })

    test('should handle multiple flags before package', () => {
      const result = service.analyzeServerVersion('npx', ['-q', '--registry', 'https://registry.npmjs.org/', '-y', 'package@1.0.0'])
      
      assert.deepStrictEqual(result, {
        packageName: 'package',
        version: '1.0.0',
        isPinned: true,
        isLatest: false
      })
    })

    test('should return null when no valid package found', () => {
      const result = service.analyzeServerVersion('npx', ['-q', '--help'])
      assert.strictEqual(result, null)
    })
  })

  describe('extractPackageName', () => {
    test('should extract package after -y flag', () => {
      const result = service.extractPackageName(['-y', 'mcp-server-nodejs-api-docs@1.1.3'])
      assert.strictEqual(result, 'mcp-server-nodejs-api-docs@1.1.3')
    })

    test('should extract package after --yes flag', () => {
      const result = service.extractPackageName(['--yes', 'mcp-server-nodejs-api-docs'])
      assert.strictEqual(result, 'mcp-server-nodejs-api-docs')
    })

    test('should extract first non-option argument', () => {
      const result = service.extractPackageName(['mcp-server-nodejs-api-docs@1.1.3'])
      assert.strictEqual(result, 'mcp-server-nodejs-api-docs@1.1.3')
    })

    test('should return null for invalid args', () => {
      const result = service.extractPackageName(['-q', '--help'])
      assert.strictEqual(result, null)
    })

    test('should return null for empty args', () => {
      const result = service.extractPackageName([])
      assert.strictEqual(result, null)
    })

    test('should handle complex argument patterns', () => {
      const result = service.extractPackageName(['-q', '-y', 'package'])
      assert.strictEqual(result, 'package')
    })

    test('should skip over options to find package without flags', () => {
      const result = service.extractPackageName(['-q', '--registry', 'https://example.com', 'package'])
      assert.strictEqual(result, 'package')
    })
  })

  describe('parsePackageVersion', () => {
    test('should parse package@version format', () => {
      const result = service.parsePackageVersion('mcp-server-nodejs-api-docs@1.1.3')
      assert.deepStrictEqual(result, {
        name: 'mcp-server-nodejs-api-docs',
        version: '1.1.3'
      })
    })

    test('should parse package without version', () => {
      const result = service.parsePackageVersion('mcp-server-nodejs-api-docs')
      assert.deepStrictEqual(result, {
        name: 'mcp-server-nodejs-api-docs',
        version: undefined
      })
    })

    test('should handle @latest suffix', () => {
      const result = service.parsePackageVersion('mcp-server-nodejs-api-docs@latest')
      assert.deepStrictEqual(result, {
        name: 'mcp-server-nodejs-api-docs',
        version: 'latest'
      })
    })

    test('should handle scoped packages without version', () => {
      const result = service.parsePackageVersion('@upstash/context7-mcp')
      assert.deepStrictEqual(result, {
        name: '@upstash/context7-mcp',
        version: undefined
      })
    })

    test('should handle scoped packages with version', () => {
      const result = service.parsePackageVersion('@upstash/context7-mcp@1.0.0')
      assert.deepStrictEqual(result, {
        name: '@upstash/context7-mcp',
        version: '1.0.0'
      })
    })

    test('should handle empty string', () => {
      const result = service.parsePackageVersion('')
      assert.deepStrictEqual(result, {
        name: '',
        version: undefined
      })
    })

    test('should handle complex version specifiers', () => {
      const result = service.parsePackageVersion('package@^1.2.3')
      assert.deepStrictEqual(result, {
        name: 'package',
        version: '^1.2.3'
      })
    })

    test('should handle beta versions', () => {
      const result = service.parsePackageVersion('package@1.0.0-beta.1')
      assert.deepStrictEqual(result, {
        name: 'package',
        version: '1.0.0-beta.1'
      })
    })

    test('should handle scoped packages with complex versions', () => {
      const result = service.parsePackageVersion('@org/package@~2.1.0')
      assert.deepStrictEqual(result, {
        name: '@org/package',
        version: '~2.1.0'
      })
    })
  })

  describe('isPinnedVersion', () => {
    test('should return false for undefined version', () => {
      const result = service.isPinnedVersion(undefined)
      assert.strictEqual(result, false)
    })

    test('should return false for latest version', () => {
      const result = service.isPinnedVersion('latest')
      assert.strictEqual(result, false)
    })

    test('should return true for specific version', () => {
      const result = service.isPinnedVersion('1.1.3')
      assert.strictEqual(result, true)
    })

    test('should return true for semver ranges', () => {
      assert.strictEqual(service.isPinnedVersion('^1.0.0'), true)
      assert.strictEqual(service.isPinnedVersion('~2.1.0'), true)
      assert.strictEqual(service.isPinnedVersion('>=1.0.0'), true)
    })

    test('should return true for beta versions', () => {
      const result = service.isPinnedVersion('1.0.0-beta.1')
      assert.strictEqual(result, true)
    })

    test('should return false for empty string', () => {
      const result = service.isPinnedVersion('')
      assert.strictEqual(result, false)
    })
  })

  describe('Edge Cases and Integration Scenarios', () => {
    test('should handle real-world Cursor MCP config scenarios', () => {
      // Test case from the original mcp.json
      const nodejsResult = service.analyzeServerVersion('npx', ['-y', 'mcp-server-nodejs-api-docs'])
      assert.strictEqual(nodejsResult?.isPinned, false)
      assert.strictEqual(nodejsResult?.isLatest, true)

      const playwrightResult = service.analyzeServerVersion('npx', ['@playwright/mcp@latest'])
      assert.strictEqual(playwrightResult?.isPinned, false)
      assert.strictEqual(playwrightResult?.isLatest, true)
      assert.strictEqual(playwrightResult?.packageName, '@playwright/mcp')
    })

    test('should handle Docker commands gracefully', () => {
      const result = service.analyzeServerVersion('docker', ['run', '-i', '--rm', '-e', 'TOKEN', 'image'])
      assert.strictEqual(result, null)
    })

    test('should handle uvx commands gracefully', () => {
      const result = service.analyzeServerVersion('uvx', ['mcp-server-fetch'])
      assert.strictEqual(result, null)
    })

    test('should handle malformed package specifications', () => {
      const result = service.analyzeServerVersion('npx', ['-y', '@'])
      assert.strictEqual(result?.packageName, '@')
      assert.strictEqual(result?.isPinned, false)
    })
  })
})
