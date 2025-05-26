import fs from 'node:fs/promises'
import path from 'node:path'

export class MCPFiles {

  private mcpFilePaths: string[] = [
    
      '~/Library/Application Support/Claude/claude_desktop_config.json',
      '.cursor/mcp.json',
      '~/.cursor/mcp.json',

  ]

  constructor(mcpFilePaths?: string[]) {
    if (mcpFilePaths) {
      this.mcpFilePaths = mcpFilePaths
    }
  }

  async findFiles(): Promise<string[]> {
    const files: string[] = []
    for (const path of this.mcpFilePaths) {
      try {
        const resolvedPath = path.replace('~', process.env.HOME || '')
        await fs.access(resolvedPath)
        files.push(resolvedPath)
      } catch (error) {
        // File does not exist, continue to next
      }
    }
    return files
  }
}

