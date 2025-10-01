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

  describe('extractNpxPackageName', () => {
    test('should extract package after -y flag', () => {
      const result = service.extractNpxPackageName(['-y', 'mcp-server-nodejs-api-docs@1.1.3'])
      assert.strictEqual(result, 'mcp-server-nodejs-api-docs@1.1.3')
    })

    test('should extract package after --yes flag', () => {
      const result = service.extractNpxPackageName(['--yes', 'mcp-server-nodejs-api-docs'])
      assert.strictEqual(result, 'mcp-server-nodejs-api-docs')
    })

    test('should extract first non-option argument', () => {
      const result = service.extractNpxPackageName(['mcp-server-nodejs-api-docs@1.1.3'])
      assert.strictEqual(result, 'mcp-server-nodejs-api-docs@1.1.3')
    })

    test('should return null for invalid args', () => {
      const result = service.extractNpxPackageName(['-q', '--help'])
      assert.strictEqual(result, null)
    })

    test('should return null for empty args', () => {
      const result = service.extractNpxPackageName([])
      assert.strictEqual(result, null)
    })

    test('should handle complex argument patterns', () => {
      const result = service.extractNpxPackageName(['-q', '-y', 'package'])
      assert.strictEqual(result, 'package')
    })

    test('should skip over options to find package without flags', () => {
      const result = service.extractNpxPackageName(['-q', '--registry', 'https://example.com', 'package'])
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

  describe('UVX Command Support', () => {
    test('should detect pinned version from first argument', () => {
      const result = service.analyzeServerVersion('uvx', ['mcp-server-sqlite@0.1.0', '--db-path', '/tmp/test.db'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: '0.1.0',
        isPinned: true,
        isLatest: false
      })
    })

    test('should detect latest version from first argument', () => {
      const result = service.analyzeServerVersion('uvx', ['mcp-server-sqlite', '--db-path', '/tmp/test.db'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: undefined,
        isPinned: false,
        isLatest: true
      })
    })

    test('should handle explicit latest version', () => {
      const result = service.analyzeServerVersion('uvx', ['mcp-server-sqlite@latest', '--db-path', '/tmp/test.db'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: 'latest',
        isPinned: false,
        isLatest: true
      })
    })

    test('should handle complex version specifiers', () => {
      const result = service.analyzeServerVersion('uvx', ['mcp-server-sqlite@1.2.3-beta.1', '--db-path', '/tmp/test.db'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: '1.2.3-beta.1',
        isPinned: true,
        isLatest: false
      })
    })

    test('should return null for empty args', () => {
      const result = service.analyzeServerVersion('uvx', [])
      assert.strictEqual(result, null)
    })

    test('should handle single package argument', () => {
      const result = service.analyzeServerVersion('uvx', ['mcp-server-sqlite@2.0.0'])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: '2.0.0',
        isPinned: true,
        isLatest: false
      })
    })
  })

  describe('UV Command Support', () => {
    test('should detect pinned version after run argument', () => {
      const result = service.analyzeServerVersion('uv', [
        '--directory', 
        'parent_of_servers_repo/servers/src/sqlite',
        'run',
        'mcp-server-sqlite@0.1.0',
        '--db-path',
        '~/test.db'
      ])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: '0.1.0',
        isPinned: true,
        isLatest: false
      })
    })

    test('should detect latest version after run argument', () => {
      const result = service.analyzeServerVersion('uv', [
        '--directory',
        'parent_of_servers_repo/servers/src/sqlite', 
        'run',
        'mcp-server-sqlite',
        '--db-path',
        '~/test.db'
      ])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: undefined,
        isPinned: false,
        isLatest: true
      })
    })

    test('should return null when run argument not found', () => {
      const result = service.analyzeServerVersion('uv', [
        '--directory',
        'some/path',
        'install',
        'mcp-server-sqlite'
      ])
      
      assert.strictEqual(result, null)
    })

    test('should handle run as first argument', () => {
      const result = service.analyzeServerVersion('uv', [
        'run',
        'mcp-server-sqlite@1.5.0',
        '--some-option'
      ])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: '1.5.0',
        isPinned: true,
        isLatest: false
      })
    })

    test('should return null when run is last argument', () => {
      const result = service.analyzeServerVersion('uv', [
        '--directory',
        'some/path',
        'run'
      ])
      
      assert.strictEqual(result, null)
    })

    test('should handle explicit latest version after run', () => {
      const result = service.analyzeServerVersion('uv', [
        'run',
        'mcp-server-sqlite@latest'
      ])
      
      assert.deepStrictEqual(result, {
        packageName: 'mcp-server-sqlite',
        version: 'latest',
        isPinned: false,
        isLatest: true
      })
    })
  })

  describe('extractPackageName method routing', () => {
    test('should route to npx extractor for npx command', () => {
      const result = service.extractPackageName('npx', ['-y', 'test-package'])
      assert.strictEqual(result, 'test-package')
    })

    test('should route to uvx extractor for uvx command', () => {
      const result = service.extractPackageName('uvx', ['test-package', '--arg'])
      assert.strictEqual(result, 'test-package')
    })

    test('should route to uv extractor for uv command', () => {
      const result = service.extractPackageName('uv', ['run', 'test-package'])
      assert.strictEqual(result, 'test-package')
    })

    test('should return null for unsupported command', () => {
      const result = service.extractPackageName('pip', ['install', 'test-package'])
      assert.strictEqual(result, null)
    })
  })

  describe('extractUvxPackageName', () => {
    test('should extract first argument as package name', () => {
      const result = service.extractUvxPackageName(['mcp-server-sqlite@1.0.0', '--db-path', '/tmp'])
      assert.strictEqual(result, 'mcp-server-sqlite@1.0.0')
    })

    test('should return null for empty args', () => {
      const result = service.extractUvxPackageName([])
      assert.strictEqual(result, null)
    })

    test('should return first argument even if it looks like an option', () => {
      const result = service.extractUvxPackageName(['--help'])
      assert.strictEqual(result, '--help')
    })
  })

  describe('extractUvPackageName', () => {
    test('should extract package name after run argument', () => {
      const result = service.extractUvPackageName(['--directory', 'path', 'run', 'test-package', '--arg'])
      assert.strictEqual(result, 'test-package')
    })

    test('should return null when run not found', () => {
      const result = service.extractUvPackageName(['--directory', 'path', 'install', 'test-package'])
      assert.strictEqual(result, null)
    })

    test('should return null for empty args', () => {
      const result = service.extractUvPackageName([])
      assert.strictEqual(result, null)
    })

    test('should return null when run is last argument', () => {
      const result = service.extractUvPackageName(['--directory', 'path', 'run'])
      assert.strictEqual(result, null)
    })

    test('should handle run at beginning', () => {
      const result = service.extractUvPackageName(['run', 'test-package'])
      assert.strictEqual(result, 'test-package')
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

    test('should handle unsupported commands gracefully', () => {
      const result = service.analyzeServerVersion('pip', ['install', 'some-package'])
      assert.strictEqual(result, null)
    })

    test('should handle malformed package specifications', () => {
      const result = service.analyzeServerVersion('npx', ['-y', '@'])
      assert.strictEqual(result?.packageName, '@')
      assert.strictEqual(result?.isPinned, false)
    })
  })
})
