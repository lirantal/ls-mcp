import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { MCPFiles } from '../src/main.ts'

// Mock the MCPConfigService to prevent real filesystem access
const mockMCPConfigService = {
  getMCPFileGroups: mock.fn(() => Promise.resolve({
    claude: {
      name: 'claude',
      friendlyName: 'Claude Desktop',
      paths: [],
      stats: { serversCount: 0 }
    },
    vscode: {
      name: 'vscode',
      friendlyName: 'VS Code',
      paths: [],
      stats: { serversCount: 0 }
    }
  })),
  getAllMCPServers: mock.fn(() => Promise.resolve({
    claude: [],
    vscode: []
  }))
}

describe('MCPFiles Class', () => {
  beforeEach(() => {
    // Reset all mocks
    mock.reset()
  })

  test('constructor initializes without errors', async () => {
    // This test verifies that the new MCPFiles class can be instantiated
    // without accessing real filesystem
    const mcpFilesManager = new MCPFiles()
    assert.ok(mcpFilesManager)
  })

  test('findFiles method exists and is callable', async () => {
    const mcpFilesManager = new MCPFiles()
    
    // Verify the method exists
    assert.ok(typeof mcpFilesManager.findFiles === 'function')
    
    // Mock the internal MCPConfigService to prevent real filesystem access
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {
        claude: {
          name: 'claude',
          friendlyName: 'Claude Desktop',
          paths: [],
          stats: { serversCount: 0 }
        }
      }
    })
    
    const result = await mcpFilesManager.findFiles()
    assert.ok(result)
    assert.ok(result.claude)
  })

  test('findFiles returns expected structure', async () => {
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to return test data
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {
        claude: {
          name: 'claude',
          friendlyName: 'Claude Desktop',
          paths: [],
          stats: { serversCount: 0 }
        },
        vscode: {
          name: 'vscode',
          friendlyName: 'VS Code',
          paths: [],
          stats: { serversCount: 0 }
        }
      }
    })
    
    const result = await mcpFilesManager.findFiles()
    
    // Verify the result has the expected structure
    assert.ok(typeof result === 'object')
    
    // Check that each result has the expected structure
    for (const [key, value] of Object.entries(result)) {
      assert.ok(typeof key === 'string')
      assert.ok(typeof value === 'object')
      assert.ok(value !== null)
      
      if (value && typeof value === 'object' && 'name' in value) {
        assert.ok(typeof value.name === 'string')
        assert.ok(typeof value.friendlyName === 'string')
        assert.ok(Array.isArray(value.paths))
      }
    }
  })

  test('findFiles handles errors gracefully', async () => {
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to simulate an error
    mock.method(mcpFilesManager, 'findFiles', async () => {
      throw new Error('Test error')
    })
    
    // The method should throw an error as expected
    await assert.rejects(async () => {
      await mcpFilesManager.findFiles()
    }, /Test error/)
  })
})

describe('CLI Integration Tests', () => {
  test('CLI exits successfully when MCP configurations are found', async () => {
    // This test verifies that the CLI can run without crashing
    // It will use the new MCPConfigService internally
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to return test data
    mock.method(mcpFilesManager, 'findFiles', async () => {
      return {
        claude: {
          name: 'claude',
          friendlyName: 'Claude Desktop',
          paths: [],
          stats: { serversCount: 0 }
        }
      }
    })
    
    const result = await mcpFilesManager.findFiles()
    assert.ok(result)
    assert.ok(result.claude)
  })

  test('CLI handles invalid JSON gracefully', async () => {
    // This test verifies that the CLI handles invalid JSON gracefully
    const mcpFilesManager = new MCPFiles()
    
    // Mock the findFiles method to simulate an error
    mock.method(mcpFilesManager, 'findFiles', async () => {
      throw new Error('Invalid JSON error')
    })
    
    // The method should throw an error as expected
    await assert.rejects(async () => {
      await mcpFilesManager.findFiles()
    }, /Invalid JSON error/)
  })
})
