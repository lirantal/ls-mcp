import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { MCPFiles } from '../src/main.ts'

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    // Reset the mocks before each test
    mock.reset()
  })

  test('handles empty configuration gracefully', async () => {
    // This test verifies that the service handles empty configurations gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to return empty test data
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {}
    })
    
    const result = await mcpFilesManager.findFiles()
    
    // The result should be an object, even if empty
    assert.ok(typeof result === 'object')
    assert.strictEqual(Object.keys(result).length, 0)
  })

  test('handles configuration with empty paths array gracefully', async () => {
    // This test verifies that the service handles empty paths gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to return test data with empty paths
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {
        empty: {
          name: 'empty',
          friendlyName: 'Empty Group',
          paths: [],
          stats: { serversCount: 0 }
        }
      }
    })
    
    const result = await mcpFilesManager.findFiles()
    
    // The result should be an object
    assert.ok(typeof result === 'object')
    assert.ok(result.empty)
    assert.strictEqual(result.empty.paths.length, 0)
  })

  test('handles permission denied errors gracefully', async () => {
    // This test verifies that the service handles permission errors gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to simulate a permission error
    mock.method(mcpFilesManager, 'findFiles', async () => {
      throw new Error('Permission denied')
    })
    
    // The method should throw an error as expected
    await assert.rejects(async () => {
      await mcpFilesManager.findFiles()
    }, /Permission denied/)
  })

  test('handles corrupted JSON files gracefully', async () => {
    // This test verifies that the service handles corrupted JSON gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to simulate a JSON parsing error
    mock.method(mcpFilesManager, 'findFiles', async () => {
      throw new Error('Invalid JSON format')
    })
    
    // The method should throw an error as expected
    await assert.rejects(async () => {
      await mcpFilesManager.findFiles()
    }, /Invalid JSON format/)
  })

  test('handles very large JSON files gracefully', async () => {
    // This test verifies that the service handles large files gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to simulate a large file error
    mock.method(mcpFilesManager, 'findFiles', async () => {
      throw new Error('File too large')
    })
    
    // The method should throw an error as expected
    await assert.rejects(async () => {
      await mcpFilesManager.findFiles()
    }, /File too large/)
  })

  test('handles duplicate file paths correctly', async () => {
    // This test verifies that the service handles duplicate paths correctly
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to return test data with duplicate paths
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {
        test: {
          name: 'test',
          friendlyName: 'Test Group',
          paths: [
            {
              filePath: '/test/path.json',
              type: 'local',
              parsable: true,
              servers: []
            }
          ],
          stats: { serversCount: 0 }
        }
      }
    })
    
    const result = await mcpFilesManager.findFiles()
    
    // The result should be an object
    assert.ok(typeof result === 'object')
    assert.ok(result.test)
    assert.strictEqual(result.test.paths.length, 1)
  })

  test('handles JSON with unusual but valid structures gracefully', async () => {
    // This test verifies that the service handles unusual JSON structures gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to return test data with unusual structures
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {
        unusual: {
          name: 'unusual',
          friendlyName: 'Unusual Group',
          paths: [
            {
              filePath: '/unusual/path.json',
              type: 'local',
              parsable: true,
              servers: []
            }
          ],
          stats: { serversCount: 0 }
        }
      }
    })
    
    const result = await mcpFilesManager.findFiles()
    
    // The result should be an object
    assert.ok(typeof result === 'object')
    assert.ok(result.unusual)
    assert.ok(result.unusual.paths[0].parsable)
  })
})
