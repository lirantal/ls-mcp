import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import fs from 'node:fs/promises'
import { MCPFiles } from '../src/main.ts'

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    mock.reset()
  })

  test('handles empty configuration object gracefully', async (t) => {
    const emptyGroups = {}
    const mcpFilesManager = new MCPFiles(emptyGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    assert.deepStrictEqual(mcpFilesList, {})
  })

  test('handles configuration with empty paths array', async (t) => {
    const emptyPathsGroups = {
      empty: {
        name: 'empty',
        friendlyName: 'Empty Group',
        paths: []
      }
    }
    const mcpFilesManager = new MCPFiles(emptyPathsGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    assert.ok(mcpFilesList.empty)
    assert.strictEqual(mcpFilesList.empty.paths.length, 0)
  })

  test('handles permission denied errors gracefully', async (t) => {
    // Test with a path that might have permission issues
    const restrictedGroups = {
      restricted: {
        name: 'restricted',
        friendlyName: 'Restricted Group',
        paths: [
          {
            filePath: '/root/restricted-file.json',
            type: 'global' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(restrictedGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    // Should handle permission errors gracefully
    assert.ok(mcpFilesList.restricted)
    // The path should not be included if it can't be accessed
    assert.strictEqual(mcpFilesList.restricted.paths.length, 0)
  })

  test('handles corrupted JSON files gracefully', async (t) => {
    // Create a temporary corrupted JSON file
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-test-'))
    const corruptedJsonPath = path.join(tempDir, 'corrupted.json')

    try {
      // Write binary data that's not valid JSON
      await fs.writeFile(corruptedJsonPath, Buffer.from([0x00, 0x01, 0x02, 0x03]))

      const corruptedGroups = {
        corrupted: {
          name: 'corrupted',
          friendlyName: 'Corrupted Group',
          paths: [
            {
              filePath: corruptedJsonPath,
              type: 'local' as const
            }
          ]
        }
      }

      const mcpFilesManager = new MCPFiles(corruptedGroups)
      const mcpFilesList = await mcpFilesManager.findFiles()

      // Should handle corrupted files by marking them as non-parsable
      assert.ok(mcpFilesList.corrupted)
      assert.strictEqual(mcpFilesList.corrupted.paths.length, 1)
      assert.strictEqual(mcpFilesList.corrupted.paths[0].parsable, false)
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  test('handles very large JSON files', async (t) => {
    // Create a large but valid JSON file
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-test-'))
    const largeJsonPath = path.join(tempDir, 'large.json')

    try {
      // Create a large configuration with many servers
      const largeConfig = {
        mcpServers: {}
      }

      // Add 100 server configurations
      for (let i = 0; i < 100; i++) {
        largeConfig.mcpServers[`server-${i}`] = {
          command: 'node',
          args: [`server-${i}.js`],
          env: { SERVER_ID: i.toString() }
        }
      }

      await fs.writeFile(largeJsonPath, JSON.stringify(largeConfig, null, 2))

      const largeGroups = {
        large: {
          name: 'large',
          friendlyName: 'Large Group',
          paths: [
            {
              filePath: largeJsonPath,
              type: 'local' as const
            }
          ]
        }
      }

      const mcpFilesManager = new MCPFiles(largeGroups)
      const mcpFilesList = await mcpFilesManager.findFiles()

      // Should handle large files correctly
      assert.ok(mcpFilesList.large)
      assert.strictEqual(mcpFilesList.large.paths.length, 1)
      assert.strictEqual(mcpFilesList.large.paths[0].parsable, true)
      assert.ok(mcpFilesList.large.paths[0].servers)
      assert.strictEqual(mcpFilesList.large.paths[0].servers.length, 100)
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  test('handles duplicate file paths correctly', async (t) => {
    const testFixturePath = path.resolve('__tests__/__fixtures__/mcp.json')
    const duplicateGroups = {
      test: {
        name: 'test',
        friendlyName: 'Test Group',
        paths: [
          {
            filePath: testFixturePath,
            type: 'local' as const
          },
          {
            filePath: testFixturePath, // Same path
            type: 'global' as const
          }
        ]
      }
    }

    const mcpFilesManager = new MCPFiles(duplicateGroups)
    const mcpFilesList = await mcpFilesManager.findFiles()

    // Should deduplicate paths
    assert.ok(mcpFilesList.test)
    assert.strictEqual(mcpFilesList.test.paths.length, 1)
  })

  test('handles JSON with unusual but valid structures', async (t) => {
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-test-'))
    const unusualJsonPath = path.join(tempDir, 'unusual.json')

    try {
      // Create JSON with nested structures and edge cases
      const unusualConfig = {
        mcpServers: {
          'server-with-null-values': {
            command: 'node',
            args: null,
            env: null
          },
          'server-with-empty-strings': {
            command: '',
            args: [''],
            env: { EMPTY: '' }
          }
        }
      }

      await fs.writeFile(unusualJsonPath, JSON.stringify(unusualConfig))

      const unusualGroups = {
        unusual: {
          name: 'unusual',
          friendlyName: 'Unusual Group',
          paths: [
            {
              filePath: unusualJsonPath,
              type: 'local' as const
            }
          ]
        }
      }

      const mcpFilesManager = new MCPFiles(unusualGroups)
      const mcpFilesList = await mcpFilesManager.findFiles()

      // Should handle unusual but valid JSON structures
      assert.ok(mcpFilesList.unusual)
      assert.strictEqual(mcpFilesList.unusual.paths.length, 1)
      assert.strictEqual(mcpFilesList.unusual.paths[0].parsable, true)
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})
