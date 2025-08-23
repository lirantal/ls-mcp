import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import fs from 'node:fs/promises'
import { DirectoryBubbleService } from '../src/services/directory-bubble-service.js'

describe('DirectoryBubbleService', () => {
  let service: DirectoryBubbleService
  let mockFsAccess: any

  test.beforeEach(() => {
    service = new DirectoryBubbleService()
    // Mock fs.access to control file existence
    mockFsAccess = mock.method(fs, 'access')
  })

  test.afterEach(() => {
    mockFsAccess.mock.restore()
  })

  describe('findLocalConfigInParentDirectories', () => {
    test('should find config file in current directory', async () => {
      const currentDir = '/tmp/test-project'
      const configPath = '.vscode/mcp.json'
      
      // Mock that file exists in current directory
      mockFsAccess.mock.mockImplementation((filePath: string) => {
        if (filePath === path.join(currentDir, configPath)) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, path.join(currentDir, configPath))
    })

    test('should find config file in parent directory', async () => {
      const currentDir = '/tmp/test-project/backend/services'
      const parentDir = '/tmp/test-project'
      const configPath = '.vscode/mcp.json'
      
      // Mock that file doesn't exist in current directory but exists in parent
      mockFsAccess.mock.mockImplementation((filePath: string) => {
        if (filePath === path.join(parentDir, configPath)) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, path.join(parentDir, configPath))
    })

    test('should find config file in grandparent directory', async () => {
      const currentDir = '/tmp/test-project/backend/services/api'
      const grandparentDir = '/tmp/test-project'
      const configPath = '.vscode/mcp.json'
      
      // Mock that file doesn't exist in current or parent but exists in grandparent
      mockFsAccess.mock.mockImplementation((filePath: string) => {
        if (filePath === path.join(grandparentDir, configPath)) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, path.join(grandparentDir, configPath))
    })

    test('should stop at home directory', async () => {
      const homeDir = process.env.HOME || '/home/user'
      const currentDir = path.join(homeDir, 'projects', 'test-project', 'backend')
      const configPath = '.vscode/mcp.json'
      
      // Mock that file doesn't exist anywhere
      mockFsAccess.mock.mockImplementation(() => {
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, null)
    })

    test('should stop at root directory', async () => {
      const currentDir = '/var/log/test-project/backend'
      const configPath = '.vscode/mcp.json'
      
      // Mock that file doesn't exist anywhere
      mockFsAccess.mock.mockImplementation(() => {
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, null)
    })

    test('should handle deeply nested directories', async () => {
      const currentDir = '/tmp/very/deeply/nested/project/structure/backend/services/api/controllers'
      const projectRoot = '/tmp/very/deeply/nested/project'
      const configPath = '.vscode/mcp.json'
      
      // Mock that file exists in project root
      mockFsAccess.mock.mockImplementation((filePath: string) => {
        if (filePath === path.join(projectRoot, configPath)) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, path.join(projectRoot, configPath))
    })

    test('should handle relative paths correctly', async () => {
      const currentDir = './relative/path/to/project'
      const absoluteCurrentDir = path.resolve(currentDir)
      const projectRoot = path.dirname(path.dirname(path.dirname(absoluteCurrentDir)))
      const configPath = '.mcp.json'
      
      // Mock that file exists in project root
      mockFsAccess.mock.mockImplementation((filePath: string) => {
        if (filePath === path.join(projectRoot, configPath)) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, path.join(projectRoot, configPath))
    })

    test('should handle access errors silently', async () => {
      const currentDir = '/tmp/test-project'
      const configPath = '.vscode/mcp.json'
      
      // Mock that fs.access throws an error
      mockFsAccess.mock.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      // Should return null without throwing
      assert.strictEqual(result, null)
    })

    test('should handle non-existent start directory', async () => {
      const currentDir = '/non/existent/directory'
      const configPath = '.vscode/mcp.json'
      
      // Mock that fs.access throws an error
      mockFsAccess.mock.mockImplementation(() => {
        return Promise.reject(new Error('ENOENT'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, null)
    })
  })

  describe('edge cases', () => {
    test('should handle circular directory references', async () => {
      const currentDir = '/tmp/test-project'
      const configPath = '.vscode/mcp.json'
      
      // Mock that getParentDirectory would create a loop
      const originalGetParent = service['getParentDirectory']
      service['getParentDirectory'] = (dir: string) => {
        if (dir === '/tmp/test-project') {
          return '/tmp/test-project' // Circular reference
        }
        return originalGetParent.call(service, dir)
      }

      mockFsAccess.mock.mockImplementation(() => {
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, null)
    })

    test('should handle very short directory paths', async () => {
      const currentDir = '/a'
      const configPath = '.vscode/mcp.json'
      
      mockFsAccess.mock.mockImplementation(() => {
        return Promise.reject(new Error('File not found'))
      })

      const result = await service.findLocalConfigInParentDirectories(configPath, currentDir)
      
      assert.strictEqual(result, null)
    })
  })
})
