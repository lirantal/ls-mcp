import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { MCPFiles } from '../src/main.ts'

describe('CLI program', () => {

  beforeEach(() => {
    // Reset the mocks before each test
    mock.reset()
  });

  test('find MCP files', async (t) => {

    const mockedMCPFileFixtures = [
      '__tests__/__fixtures__/mcp.json',
      '__tests__/__fixtures__/subdir/mcp2.json',
    ];

    const mcpFilesManager = new MCPFiles(mockedMCPFileFixtures);
    const mcpFilesList = await mcpFilesManager.findFiles();
    assert.deepStrictEqual(mcpFilesList, mockedMCPFileFixtures);
  })

});