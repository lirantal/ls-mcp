import fs from 'node:fs/promises'
import { platform } from 'node:os'
import path from 'node:path'
import { MCPConfigLinterService } from './services/mcp-config-linter-service.ts'
import { MCPServerManagerService } from './services/mcp-server-manager-service.ts'

interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http',
  type?: 'sse' | 'http' | 'stdio'
  source?: string
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
  claude_code: [],
  cursor: [],
  vscode: [],
  cline: [],
  windsurf: [],
  roo: [],
  'intellij-github-copilot': []
}

if (platform() === 'win32') {
  osSpecificPaths['claude'] = [
    { filePath: `${process.env.APPDATA}\\Claude\\claude_desktop_config.json`, type: 'global' }
  ]
  osSpecificPaths['claude_code'] = [
    { filePath: '.mcp.json', type: 'local' }
  ]
  osSpecificPaths['cursor'] = [
    { filePath: `${process.env.HOME}\\.cursor\\mcp.json`, type: 'global' },
    { filePath: '.cursor\\mcp.json', type: 'local' }
  ]
  osSpecificPaths['vscode'] = [
    { filePath: '.vscode\\mcp.json', type: 'local' },
    { filePath: `${process.env.APPDATA}\\Code\\User\\settings.json`, type: 'global' },
    { filePath: `${process.env.APPDATA}\\Code - Insiders\\User\\settings.json`, type: 'global' },
  ]
  osSpecificPaths['cline'] = [
    { filePath: `${process.env.APPDATA}\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json`, type: 'global' },
    { filePath: `${process.env.APPDATA}\\Code - Insiders\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json`, type: 'global' }
  ]
  osSpecificPaths['windsurf'] = [
    { filePath: '.codeium\\windsurf\\mcp_config.json', type: 'local' },
  ]
  osSpecificPaths['roo'] = [
    { filePath: `${process.env.APPDATA}\\Code\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json`, type: 'global' },
    { filePath: `${process.env.APPDATA}\\Code - Insiders\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json`, type: 'global' },
  ]
  osSpecificPaths['intellij-github-copilot'] = [
    { filePath: `${process.env.LOCALAPPDATA}\\github-copilot\\intellij\\mcp.json`, type: 'global' },
  ]
  osSpecificPaths['zed'] = [
    { filePath: `${process.env.LOCALAPPDATA}\\zed\\settings.json`, type: 'global' },
    { filePath: '.zed\\settings.json', type: 'local' }
  ]
} else {
  osSpecificPaths['claude'] = [
    { filePath: '~/Library/Application Support/Claude/claude_desktop_config.json', type: 'global' }
  ]
  osSpecificPaths['claude_code'] = [
    { filePath: '.mcp.json', type: 'local' }
  ]
  osSpecificPaths['cursor'] = [
    { filePath: '~/.cursor/mcp.json', type: 'global' },
    { filePath: '.cursor/mcp.json', type: 'local' }
  ]
  osSpecificPaths['vscode'] = [
    { filePath: '.vscode/mcp.json', type: 'local' },
    { filePath: '~/Library/Application Support/Code/User/settings.json', type: 'global' },
    { filePath: '~/Library/Application Support/Code - Insiders/User/settings.json', type: 'global' },
  ]
  osSpecificPaths['cline'] = [
    { filePath: '~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json', type: 'global' },
    { filePath: '~/Library/Application Support/Code - Insiders/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json', type: 'global' }
  ]
  osSpecificPaths['windsurf'] = [
    { filePath: '.codeium/windsurf/mcp_config.json', type: 'local' },
  ]
  osSpecificPaths['roo'] = [
    { filePath: '~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json', type: 'global' },
    { filePath: '~/Library/Application Support/Code - Insiders/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json', type: 'global' },
  ]
  osSpecificPaths['intellij-github-copilot'] = [
    { filePath: '~/.config/github-copilot/intellij/mcp.json', type: 'global' },
  ]
  osSpecificPaths['zed'] = [
    { filePath: '~/.config/zed/settings.json', type: 'global' },
    { filePath: '.zed/settings.json', type: 'local' }
  ]
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
    zed: {
      name: 'zed',
      friendlyName: 'Zed',
      paths: osSpecificPaths['zed']
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
