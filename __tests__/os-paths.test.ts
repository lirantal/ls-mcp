import { test } from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { getWindowsPaths, getDarwinPaths } from '../src/utils/os-paths.ts'

test.describe('os-paths', () => {
  test.describe('getWindowsPaths', () => {
    test('should return the correct paths for Windows', () => {
      const paths = getWindowsPaths()
      assert.deepStrictEqual(paths.claude[0].filePath, path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'))
    })
  })

  test.describe('getDarwinPaths', () => {
    test('should return the correct paths for Darwin', () => {
      const paths = getDarwinPaths()
      assert.deepStrictEqual(paths.claude[0].filePath, path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'))
    })
  })
})
