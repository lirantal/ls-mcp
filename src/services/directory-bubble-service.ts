import path from 'node:path'
import fs from 'node:fs/promises'
import { homedir } from 'node:os'

export class DirectoryBubbleService {
  /**
   * Find a local MCP config file by bubbling up the directory tree
   * @param localPath - The relative path to search for (e.g., '.vscode/mcp.json')
   * @param startDir - The directory to start searching from
   * @returns The absolute path to the found config file, or null if not found
   */
  async findLocalConfigInParentDirectories (
    localPath: string,
    startDir: string
  ): Promise<string | null> {
    try {
      let currentDir = path.resolve(startDir)
      const homeDir = homedir()
      const rootDir = '/'
      let iterationCount = 0
      const maxIterations = 100 // Safety limit to prevent infinite loops

      // Check the start directory first
      const startDirResult = await this.checkDirectoryForConfig(currentDir, localPath)
      if (startDirResult) {
        return path.join(currentDir, localPath)
      }

      // Bubble up directory tree until we reach home directory or root
      while (currentDir !== homeDir && currentDir !== rootDir && iterationCount < maxIterations) {
        const parentDir = this.getParentDirectory(currentDir)
        if (!parentDir || parentDir === currentDir) {
          break
        }

        // Additional safety check: ensure we're actually moving up the tree
        if (parentDir === currentDir || parentDir.length >= currentDir.length) {
          break
        }

        currentDir = parentDir
        iterationCount++

        const found = await this.checkDirectoryForConfig(currentDir, localPath)
        if (found) {
          return path.join(currentDir, localPath)
        }
      }

      return null
    } catch (error) {
      // Silently catch errors as per requirements
      return null
    }
  }

  /**
   * Check if a config file exists in the specified directory
   * @param dir - The directory to check
   * @param configPath - The relative path to the config file
   * @returns True if the config file exists and is accessible
   */
  private async checkDirectoryForConfig (dir: string, configPath: string): Promise<boolean> {
    try {
      const fullPath = path.join(dir, configPath)
      await fs.access(fullPath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get the parent directory of the specified directory
   * @param dir - The directory to get the parent of
   * @returns The parent directory path, or null if already at root
   */
  private getParentDirectory (dir: string): string | null {
    const parent = path.dirname(dir)
    return parent === dir ? null : parent
  }
}
