import fs from 'node:fs/promises'
import { platform } from 'node:os'
import path from 'node:path'
import { MCPConfigLinterService } from './services/mcp-config-linter-service.ts'
import { MCPServerManagerService } from './services/mcp-server-manager-service.ts'
import { getWindowsPaths, getDarwinPaths } from './utils/os-paths.ts'
import { type MCPServerInfo, type MCPFilePath, type MCPFilePathGroupsRecord, type MCPFileGroupsResultRecord } from './types.ts'

let osSpecificPaths: { [key: string]: MCPFilePath[] } = {}

if (platform() === 'win32') {
  osSpecificPaths = getWindowsPaths()
} else {
  osSpecificPaths = getDarwinPaths()
}

export class MCPFiles {
  private mcpFilePathGroups: MCPFilePathGroupsRecord = {
    claude: {
      name: 'claude-desktop',
      friendlyName: 'Claude Desktop',
      paths: osSpecificPaths['claude']
    },
    claude_code: {
      name: 'claude-code',
      friendlyName: 'Claude Code',
      paths: osSpecificPaths['claude_code']
    },
    cursor: {
      name: 'cursor',
      friendlyName: 'Cursor',
      paths: osSpecificPaths['cursor']
    },
    vscode: {
      name: 'vscode',
      friendlyName: 'VS Code',
      paths: osSpecificPaths['vscode']
    },
    cline: {
      name: 'cline',
      friendlyName: 'Cline',
      paths: osSpecificPaths['cline']
    },
    windsurf: {
      name: 'windsurf',
      friendlyName: 'Windsurf',
      paths: osSpecificPaths['windsurf']
    },
    roo: {
      name: 'roo',
      friendlyName: 'Roo',
      paths: osSpecificPaths['roo']
    },
    'intellij-github-copilot': {
      name: 'intellij-github-copilot',
      friendlyName: 'IntelliJ GitHub Copilot',
      paths: osSpecificPaths['intellij-github-copilot']
    },
    junie: {
      name: 'junie',
      friendlyName: 'IntelliJ Junie',
      paths: osSpecificPaths['junie']
    },
    zed: {
      name: 'zed',
      friendlyName: 'Zed',
      paths: osSpecificPaths['zed']
    },
    gemini: {
      name: 'gemini-cli',
      friendlyName: 'Gemini CLI',
      paths: osSpecificPaths.gemini
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

          // @TODO if file isn't parsable we should skip the following logic here
          const mcpServersData: MCPServerInfo[] = []
          const mcpServersFromConfig = await MCPConfigLinter.getMCPServers()
          // let's iterate over the mcpServer Record and access the server objects
          for (const serverName of Object.keys(mcpServersFromConfig)) {
            const serverConfigRaw = mcpServersFromConfig[serverName] as any
            const serverConfig = {
              name: serverName,
              command: serverConfigRaw.command || '',
              args: serverConfigRaw.args,
              url: serverConfigRaw.url,
              transport: serverConfigRaw.transport,
              type: serverConfigRaw.type,
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
              source: MCPServerManager.getSource(),
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
