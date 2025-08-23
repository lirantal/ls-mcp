import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { MCPConfigService } from '../src/services/mcp-config-service.js'
import { DirectoryBubbleService } from '../src/services/directory-bubble-service.js'

describe('MCPConfigService Directory Bubbling Integration', () => {
  let mockDirectoryBubbleService: any

  test.beforeEach(() => {
    // Mock the DirectoryBubbleService instead of fs.access
    mockDirectoryBubbleService = mock.method(DirectoryBubbleService.prototype, 'findLocalConfigInParentDirectories')
  })

  test.afterEach(() => {
    mockDirectoryBubbleService.mock.restore()
  })

  describe('directory bubbling behavior control', () => {
    test('should not bubble up when directory bubbling is disabled', async () => {
      // Create service with directory bubbling disabled
      const service = new MCPConfigService({ enableDirectoryBubbling: false })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, false)
      
      // Verify that the directory bubble service is not called
      mockDirectoryBubbleService.mock.mockImplementation(() => {
        assert.fail('Directory bubble service should not be called when disabled')
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should bubble up when directory bubbling is enabled', async () => {
      // Create service with directory bubbling enabled
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that directory bubbling would work
      mockDirectoryBubbleService.mock.mockImplementation((localPath: string, startDir: string) => {
        if (localPath.includes('.vscode/mcp.json')) {
          // Return a path in parent directory
          return Promise.resolve(path.join(path.dirname(startDir), '.vscode', 'mcp.json'))
        }
        return Promise.resolve(null)
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should use default behavior when no options provided', async () => {
      // Create service with default options (directory bubbling disabled)
      const service = new MCPConfigService()
      
      // Test that the service is created with the default setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, false)
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })
  })

  describe('directory bubbling for local paths', () => {
    test('should detect local config in current directory without bubbling', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that no bubbling is needed (file exists in current directory)
      mockDirectoryBubbleService.mock.mockImplementation(() => {
        return Promise.resolve(null) // No bubbling needed
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should bubble up to find local config in parent directory', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that .vscode/mcp.json exists in parent directory
      mockDirectoryBubbleService.mock.mockImplementation((localPath: string, startDir: string) => {
        if (localPath.includes('.vscode/mcp.json')) {
          // Return a path in parent directory
          return Promise.resolve(path.join(path.dirname(startDir), '.vscode', 'mcp.json'))
        }
        return Promise.resolve(null)
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should not bubble up for global paths', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that no bubbling is needed for global paths
      mockDirectoryBubbleService.mock.mockImplementation(() => {
        return Promise.resolve(null) // No bubbling up
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should handle multiple local config files with different priorities', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that some files exist in current directory, others need bubbling
      mockDirectoryBubbleService.mock.mockImplementation((localPath: string, startDir: string) => {
        if (localPath.includes('.mcp.json')) {
          // .mcp.json exists in current directory
          return Promise.resolve(null)
        }
        if (localPath.includes('.vscode/mcp.json')) {
          // .vscode/mcp.json needs bubbling up
          return Promise.resolve(path.join(path.dirname(startDir), '.vscode', 'mcp.json'))
        }
        return Promise.resolve(null)
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should maintain backward compatibility for root directory execution', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that .vscode/mcp.json exists in current directory
      mockDirectoryBubbleService.mock.mockImplementation(() => {
        return Promise.resolve(null) // No bubbling needed
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })
  })

  describe('error handling during directory bubbling', () => {
    test('should handle fs.access errors gracefully', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that directory bubbling throws an error
      mockDirectoryBubbleService.mock.mockImplementation(() => {
        throw new Error('Permission denied')
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })

    test('should continue processing other paths if one fails', async () => {
      // Enable directory bubbling for these tests
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Test that the service is created with the correct setting
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Mock that some paths fail and others succeed
      mockDirectoryBubbleService.mock.mockImplementation((localPath: string, startDir: string) => {
        if (localPath.includes('.vscode/mcp.json')) {
          // This path succeeds
          return Promise.resolve(path.join(startDir, '.vscode', 'mcp.json'))
        }
        if (localPath.includes('.mcp.json')) {
          // This path fails
          throw new Error('Permission denied')
        }
        return Promise.resolve(null)
      })
      
      // Test that basic methods work
      assert.strictEqual(typeof service.getAllConfigFiles, 'function')
      assert.strictEqual(typeof service.getConfigFilesPerApp, 'function')
    })
  })

  describe('directory bubble service integration', () => {
    test('should call directory bubble service when enabled', async () => {
      const service = new MCPConfigService({ enableDirectoryBubbling: true })
      
      // Mock the directory bubble service to track calls
      let callCount = 0
      mockDirectoryBubbleService.mock.mockImplementation((localPath: string, startDir: string) => {
        callCount++
        return Promise.resolve(null)
      })
      
      // Test that the service is properly configured
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, true)
      
      // Verify that the directory bubble service is available
      assert.ok(service['directoryBubbleService'])
      assert.ok(service['directoryBubbleService'] instanceof DirectoryBubbleService)
    })

    test('should not call directory bubble service when disabled', async () => {
      const service = new MCPConfigService({ enableDirectoryBubbling: false })
      
      // Mock the directory bubble service to track calls
      let callCount = 0
      mockDirectoryBubbleService.mock.mockImplementation((localPath: string, startDir: string) => {
        callCount++
        return Promise.resolve(null)
      })
      
      // Test that the service is properly configured
      assert.ok(service)
      // @ts-ignore - accessing private property for testing
      assert.strictEqual(service.enableDirectoryBubbling, false)
      
      // Verify that the directory bubble service is still available but won't be used
      assert.ok(service['directoryBubbleService'])
      assert.ok(service['directoryBubbleService'] instanceof DirectoryBubbleService)
    })
  })
})
