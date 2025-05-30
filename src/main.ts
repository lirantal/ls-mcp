import fs from 'node:fs/promises'
import { MCPConfigLinterService } from './services/mcp-config-linter-service.ts'

interface MCPFilePath {
  filePath: string
  type: 'local' | 'global'
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
        { filePath: '.cursor/mcp.json', type: 'local' },
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
        paths: [],
        stats: {}
      }

      for (const filePathData of clientsGroup.paths) {
        const resolvedPath: string = filePathData.filePath.replace('~', process.env.HOME || '')
        try {
          await fs.access(resolvedPath)

          const MCPConfigLinter = new MCPConfigLinterService(resolvedPath)
          const parsable = await MCPConfigLinter.isValidSyntax()
          filePathData.parsable = parsable

          mcpFilesPathsData[groupName]['stats']['serversCount'] = await MCPConfigLinter.countMCPServers()

          mcpFilesPathsData[groupName].paths.push(filePathData)
        } catch (error) {
          // File does not exist, continue to next
        }
      }
    }

    return mcpFilesPathsData
  }
}
