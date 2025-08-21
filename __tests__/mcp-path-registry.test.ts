import { test, describe } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { MCPPathRegistry } from '../src/services/mcp-path-registry.js'

describe('MCPPathRegistry', () => {
  let registry: MCPPathRegistry

  test.beforeEach(() => {
    registry = new MCPPathRegistry()
  })

  describe('getPathsForOS', () => {
    test('should return Windows paths for win32', () => {
      const paths = registry.getPathsForOS('win32')
      
      assert.ok(paths.claude)
      assert.ok(paths.vscode)
      assert.ok(paths.cursor)
      assert.strictEqual(paths.claude[0].filePath, path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'))
      assert.strictEqual(paths.claude[0].type, 'global')
    })

    test('should return Windows paths for windows', () => {
      const paths = registry.getPathsForOS('windows')
      
      assert.ok(paths.claude)
      assert.ok(paths.vscode)
      assert.strictEqual(paths.claude[0].filePath, path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'))
    })

    test('should return Darwin paths for darwin', () => {
      const paths = registry.getPathsForOS('darwin')
      
      assert.ok(paths.claude)
      assert.ok(paths.vscode)
      assert.strictEqual(paths.claude[0].filePath, path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'))
      assert.strictEqual(paths.claude[0].type, 'global')
    })

    test('should return Darwin paths for macos', () => {
      const paths = registry.getPathsForOS('macos')
      
      assert.ok(paths.claude)
      assert.ok(paths.vscode)
      assert.strictEqual(paths.claude[0].filePath, path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'))
    })

    test('should throw error for unsupported OS', () => {
      assert.throws(() => {
        registry.getPathsForOS('linux')
      }, /Unsupported operating system: linux/)
    })
  })

  describe('getPathsForApp', () => {
    test('should return paths for specific app on Windows', () => {
      const paths = registry.getPathsForApp('win32', 'claude')
      
      assert.strictEqual(paths.length, 1)
      assert.strictEqual(paths[0].filePath, path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'))
      assert.strictEqual(paths[0].type, 'global')
    })

    test('should return paths for specific app on Darwin', () => {
      const paths = registry.getPathsForApp('darwin', 'cursor')
      
      assert.strictEqual(paths.length, 2)
      assert.strictEqual(paths[0].filePath, path.join(process.env.HOME || '', '.cursor', 'mcp.json'))
      assert.strictEqual(paths[0].type, 'global')
      assert.strictEqual(paths[1].filePath, path.join('.cursor', 'mcp.json'))
      assert.strictEqual(paths[1].type, 'local')
    })

    test('should throw error for non-existent app', () => {
      assert.throws(() => {
        registry.getPathsForApp('win32', 'nonexistent-app')
      }, /App 'nonexistent-app' not found for OS 'win32'/)
    })
  })

  describe('getSupportedApps', () => {
    test('should return all supported apps for Windows', () => {
      const apps = registry.getSupportedApps('win32')
      
      assert.ok(apps.includes('claude'))
      assert.ok(apps.includes('vscode'))
      assert.ok(apps.includes('cursor'))
      assert.ok(apps.includes('cline'))
      assert.ok(apps.includes('windsurf'))
      assert.ok(apps.includes('roo'))
      assert.ok(apps.includes('intellij-github-copilot'))
      assert.ok(apps.includes('junie'))
      assert.ok(apps.includes('zed'))
      assert.ok(apps.includes('gemini'))
    })

    test('should return all supported apps for Darwin', () => {
      const apps = registry.getSupportedApps('darwin')
      
      assert.ok(apps.includes('claude'))
      assert.ok(apps.includes('vscode'))
      assert.ok(apps.includes('cursor'))
      assert.ok(apps.includes('cline'))
      assert.ok(apps.includes('windsurf'))
      assert.ok(apps.includes('roo'))
      assert.ok(apps.includes('intellij-github-copilot'))
      assert.ok(apps.includes('junie'))
      assert.ok(apps.includes('zed'))
      assert.ok(apps.includes('gemini'))
    })
  })

  describe('getSupportedOperatingSystems', () => {
    test('should return supported operating systems', () => {
      const osList = registry.getSupportedOperatingSystems()
      
      assert.strictEqual(osList.length, 2)
      assert.ok(osList.includes('win32'))
      assert.ok(osList.includes('darwin'))
    })
  })

  describe('registerCustomApp', () => {
    test('should register custom app for Windows', () => {
      const customPaths = [
        { filePath: '/custom/path/config.json', type: 'global' as const }
      ]
      
      registry.registerCustomApp('win32', 'custom-app', customPaths)
      const paths = registry.getPathsForOSWithCustom('win32')
      
      assert.ok(paths['custom-app'])
      assert.strictEqual(paths['custom-app'].length, 1)
      assert.strictEqual(paths['custom-app'][0].filePath, '/custom/path/config.json')
      assert.strictEqual(paths['custom-app'][0].type, 'global')
    })

    test('should register custom app for Darwin', () => {
      const customPaths = [
        { filePath: '/custom/darwin/config.json', type: 'local' as const }
      ]
      
      registry.registerCustomApp('darwin', 'custom-app', customPaths)
      const paths = registry.getPathsForOSWithCustom('darwin')
      
      assert.ok(paths['custom-app'])
      assert.strictEqual(paths['custom-app'].length, 1)
      assert.strictEqual(paths['custom-app'][0].filePath, '/custom/darwin/config.json')
      assert.strictEqual(paths['custom-app'][0].type, 'local')
    })
  })

  describe('getPathsForOSWithCustom', () => {
    test('should return base paths when no custom apps registered', () => {
      const paths = registry.getPathsForOSWithCustom('win32')
      
      assert.ok(paths.claude)
      assert.ok(paths.vscode)
      assert.strictEqual(Object.keys(paths).length, 11) // All base apps
    })

    test('should return base paths plus custom apps', () => {
      const customPaths = [
        { filePath: '/custom/path/config.json', type: 'global' as const }
      ]
      
      registry.registerCustomApp('win32', 'custom-app', customPaths)
      const paths = registry.getPathsForOSWithCustom('win32')
      
      assert.ok(paths.claude) // Base app
      assert.ok(paths['custom-app']) // Custom app
      assert.strictEqual(Object.keys(paths).length, 12) // Base apps + custom
    })
  })
})
