import fs from 'node:fs/promises'
import { MCPLinterService } from './services/mcp-linter-service.ts'

interface MCPFilePath {
  filePath: string
  type: 'relative' | 'global'
}

interface MCPFileGroups {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
}

type MCPFilePathGroupsRecord = Record<string, MCPFileGroups>

export class MCPFiles {
  private mcpFilePathGroups: MCPFilePathGroupsRecord = {
    claude: {
      name: 'claude',
      friendlyName: 'Claude Desktop',
      paths: [
        { filePath: '~/Library/Application Support/Claude/claude_desktop_config.json', type: 'global' },
      ]
    },
    cursor: {
      name: 'cursor',
      friendlyName: 'Cursor',
      paths: [
        { filePath: '.cursor/mcp.json', type: 'relative' },
        { filePath: '~/.cursor/mcp.json', type: 'global' },
      ]
    }
  }

  constructor (mcpFilePathGroups?: MCPFilePathGroupsRecord) {
    this.mcpFilePathGroups = mcpFilePathGroups || this.mcpFilePathGroups
  }

  async findFiles (): Promise<T> {
    const mcpFilesPathsData = {}

    for (const groupName of Object.keys(this.mcpFilePathGroups)) {
      const clientsGroup = this.mcpFilePathGroups[groupName]
      mcpFilesPathsData[groupName] = {
        name: clientsGroup.name,
        friendlyName: clientsGroup.friendlyName,
        paths: []
      }

      for (const filePathData of clientsGroup.paths) {
        const resolvedPath: string = filePathData.filePath.replace('~', process.env.HOME || '')
        try {
          await fs.access(resolvedPath)

          const MCPLinter = new MCPLinterService(resolvedPath)
          const parsable = await MCPLinter.isValidSyntax()
          filePathData.parsable = parsable

          mcpFilesPathsData[groupName].paths.push(filePathData)
        } catch (error) {
          // File does not exist, continue to next
        }
      }
    }

    return mcpFilesPathsData
  }
}
