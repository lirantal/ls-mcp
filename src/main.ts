import fs from 'node:fs/promises'
import { platform } from 'node:os'
import path from 'node:path'
import { MCPConfigLinterService } from './services/mcp-config-linter-service.ts'
import { MCPServerManagerService } from './services/mcp-server-manager-service.ts'

interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse',
  env?: Record<string, string>
  status?: 'running' | 'stopped'
}

interface MCPFilePath {
  filePath: string
  type: 'local' | 'global'
  parsable?: boolean
  servers?: MCPServerInfo[]
}

interface MCPFileGroups {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
  stats?: {
    serversCount?: number
  }
}

interface MCPFileGroupsResult {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
  stats: {
    serversCount?: number
  }
}

type MCPFilePathGroupsRecord = Record<string, MCPFileGroups>
type MCPFileGroupsResultRecord = Record<string, MCPFileGroupsResult>

const osSpecificPaths: { [key: string]: MCPFilePath[] } = {
  claude: [],
  cursor: []
}

if (platform() === 'win32') {
  osSpecificPaths['claude'] = [
    { filePath: `${process.env.APPDATA}\\Claude\\claude_desktop_config.json`, type: 'global' }
  ]
  osSpecificPaths['cursor'] = [
    { filePath: `${process.env.HOME}\\.cursor\\mcp.json`, type: 'global' },
    { filePath: '.cursor\\mcp.json', type: 'local' }
  ]
} else {
  osSpecificPaths['claude'] = [
    { filePath: '~/Library/Application Support/Claude/claude_desktop_config.json', type: 'global' }
  ]
  osSpecificPaths['cursor'] = [
    { filePath: '~/.cursor/mcp.json', type: 'global' },
    { filePath: '.cursor/mcp.json', type: 'local' }
  ]
}

export class MCPFiles {
  private mcpFilePathGroups: MCPFilePathGroupsRecord = {
    claude: {
      name: 'claude-desktop',
      friendlyName: 'Claude Desktop',
      paths: osSpecificPaths['claude']
    },
    cursor: {
      name: 'cursor',
      friendlyName: 'Cursor',
      paths: osSpecificPaths['cursor']
    }
  }

  constructor (mcpFilePathGroups?: MCPFilePathGroupsRecord) {
    this.mcpFilePathGroups = mcpFilePathGroups || this.mcpFilePathGroups
  }

  async findFiles (): Promise<MCPFileGroupsResultRecord> {
    const mcpFilesPathsData: MCPFileGroupsResultRecord = {}

    for (const groupName of Object.keys(this.mcpFilePathGroups)) {
      const clientsGroup = this.mcpFilePathGroups[groupName]
      mcpFilesPathsData[groupName] = {
        name: clientsGroup.name,
        friendlyName: clientsGroup.friendlyName,
        paths: [],
        stats: {}
      }

      const uniqueFilePaths = new Set<string>()

      for (const filePathData of clientsGroup.paths) {
        const resolvedPath: string = filePathData.filePath.replace('~', process.env.HOME || '')
        const absolutePath: string = path.resolve(resolvedPath)
        if (uniqueFilePaths.has(absolutePath)) {
          continue
        }
        uniqueFilePaths.add(absolutePath)

        try {
          await fs.access(resolvedPath)

          const MCPConfigLinter = new MCPConfigLinterService(resolvedPath)
          const parsable = await MCPConfigLinter.isValidSyntax()
          filePathData.parsable = parsable

          const mcpServersData: MCPServerInfo[] = []
          const mcpServersFromConfig = await MCPConfigLinter.getMCPServers()
          // let's iterate over the mcpServer Record and access the server objects
          for (const serverName of Object.keys(mcpServersFromConfig)) {
            const serverConfigRaw = mcpServersFromConfig[serverName] as any
            const serverConfig = {
              name: serverName,
              command: serverConfigRaw.command || '',
              args: serverConfigRaw.args,
              transport: serverConfigRaw.transport,
              env: serverConfigRaw.env
            }
            const MCPServerManager = new MCPServerManagerService(serverConfig)

            const mcpServerProcessDetection = MCPServerManager.isRunning()
            let mcpServerProcess = false
            if (mcpServerProcessDetection) {
              if (typeof mcpServerProcessDetection === 'object' && mcpServerProcessDetection.estimatedProduct === clientsGroup.name) {
                mcpServerProcess = true
              }
            }

            mcpServersData.push({
              name: MCPServerManager.getName(),
              command: MCPServerManager.getCmd(),
              args: MCPServerManager.getArgs(),
              transport: MCPServerManager.getTransport(),
              env: MCPServerManager.getEnv(),
              status: mcpServerProcess ? 'running' : 'stopped'
            })
          }

          filePathData.servers = mcpServersData

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
