import { platform } from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import util from 'node:util'
import { MCPPathRegistry, MCPConfigParser, DirectoryBubbleService } from 'agent-files'
import { CredentialDetectionService } from './credential-detection-service.js'
import { MCPVersionDetectionService } from './mcp-version-detection-service.js'
import { extractHostname } from '../utils/url-utils.js'
import {
  type MCPAppPathsRecord,
  type MCPFilePath,
  type MCPServerInfo,
  type MCPAppMetadata,
  type MCPFileGroupsResultRecord
} from '../types/mcp-config-service.types.js'

export interface MCPConfigServiceOptions {
  enableDirectoryBubbling?: boolean
}

export class MCPConfigService {
  private pathRegistry: MCPPathRegistry
  private currentOS: string
  private debug: util.DebugLogger
  private directoryBubbleService: DirectoryBubbleService
  private versionDetectionService: MCPVersionDetectionService
  private enableDirectoryBubbling: boolean

  constructor (options: MCPConfigServiceOptions = {}) {
    this.pathRegistry = new MCPPathRegistry()
    this.currentOS = platform()
    this.debug = util.debuglog('ls-mcp')
    this.directoryBubbleService = new DirectoryBubbleService()
    this.versionDetectionService = new MCPVersionDetectionService()
    this.enableDirectoryBubbling = options.enableDirectoryBubbling ?? false
  }

  /**
   * Get MCP configuration files for a specific AI application on the current OS
   */
  getConfigFilesPerApp (appName: string): MCPFilePath[] {
    try {
      return this.pathRegistry.getPathsForApp(this.currentOS, appName) as MCPFilePath[]
    } catch (error) {
      throw new Error(`Failed to get config files for app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get MCP configuration files for all AI applications on the current OS
   */
  getAllConfigFiles (): MCPAppPathsRecord {
    try {
      return this.pathRegistry.getPathsForOS(this.currentOS) as MCPAppPathsRecord
    } catch (error) {
      throw new Error(`Failed to get all config files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get MCP servers configured for a specific AI application on the current OS
   */
  async getMCPServersPerApp (appName: string): Promise<MCPServerInfo[]> {
    try {
      const appPaths = this.getConfigFilesPerApp(appName)
      const allServers: MCPServerInfo[] = []

      for (const filePath of appPaths) {
        const servers = await this.parseConfigFileForServers(filePath.filePath)
        allServers.push(...servers)
      }

      return allServers
    } catch (error) {
      throw new Error(`Failed to get MCP servers for app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get MCP servers configured for all AI applications on the current OS
   */
  async getAllMCPServers (): Promise<Record<string, MCPServerInfo[]>> {
    try {
      const allApps = this.pathRegistry.getSupportedApps(this.currentOS)
      const allServers: Record<string, MCPServerInfo[]> = {}

      for (const appName of allApps) {
        try {
          allServers[appName] = await this.getMCPServersPerApp(appName)
        } catch (error) {
          // Log error but continue with other apps
          this.debug(`Failed to get servers for app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
          allServers[appName] = []
        }
      }

      return allServers
    } catch (error) {
      throw new Error(`Failed to get all MCP servers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get metadata for all supported AI applications on the current OS
   */
  getSupportedApps (): MCPAppMetadata[] {
    try {
      const appNames = this.pathRegistry.getSupportedApps(this.currentOS)
      const appPaths = this.pathRegistry.getPathsForOS(this.currentOS)

      return appNames.map(appName => ({
        name: appName,
        friendlyName: this.getFriendlyName(appName),
        paths: (appPaths as MCPAppPathsRecord)[appName] || []
      }))
    } catch (error) {
      throw new Error(`Failed to get supported apps: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all supported operating systems
   */
  getSupportedOperatingSystems (): string[] {
    return this.pathRegistry.getSupportedOperatingSystems()
  }

  /**
   * Validate if a configuration file exists and is parsable
   */
  async validateConfigFile (filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      const parser = this.createParser(filePath)
      return await parser.isValidSyntax()
    } catch (error) {
      return false
    }
  }

  /**
   * Create a parser instance (can be overridden for testing)
   */
  protected createParser (filePath: string): MCPConfigParser {
    return new MCPConfigParser(filePath)
  }

  /**
   * Get MCP file groups with resolved paths and server information
   */
  async getMCPFileGroups (): Promise<MCPFileGroupsResultRecord> {
    try {
      const appPaths = this.getAllConfigFiles()
      const mcpFilesPathsData: MCPFileGroupsResultRecord = {}

      for (const groupName of Object.keys(appPaths)) {
        const paths = appPaths[groupName]
        mcpFilesPathsData[groupName] = {
          name: groupName,
          friendlyName: this.getFriendlyName(groupName),
          paths: [],
          stats: { serversCount: 0 }
        }

        const uniqueFilePaths = new Set<string>()
        let totalServersCount = 0

        for (const filePathData of paths) {
          let resolvedPath = filePathData.filePath.replace('~', process.env.HOME || '')
          let absolutePath = path.resolve(resolvedPath)

          // For local paths, try to bubble up if not found in current directory and if enabled
          if (filePathData.type === 'local' && this.enableDirectoryBubbling) {
            try {
              await fs.access(resolvedPath)
              // File exists in current directory, no need to bubble up
            } catch (error) {
              // File not found in current directory, try to bubble up
              const bubbledPath = await this.directoryBubbleService.findLocalConfigInParentDirectories(
                filePathData.filePath,
                process.cwd()
              )

              if (bubbledPath) {
                resolvedPath = bubbledPath
                absolutePath = path.resolve(resolvedPath)
              }
            }
          }

          if (uniqueFilePaths.has(absolutePath)) {
            continue
          }
          uniqueFilePaths.add(absolutePath)

          try {
            await fs.access(resolvedPath)

            const parser = this.createParser(resolvedPath)
            const parsable = await parser.isValidSyntax()
            filePathData.parsable = parsable

            if (parsable) {
              const configData = await parser.parseConfigFile()
              const servers = await this.convertToMCPServerInfo(configData.servers || {})
              filePathData.servers = servers
              totalServersCount += servers.length
            }

            mcpFilesPathsData[groupName].paths.push(filePathData)
          } catch (error) {
            // File does not exist or is not accessible, continue to next
            this.debug(`Skipping file ${resolvedPath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }

        if (mcpFilesPathsData[groupName] && mcpFilesPathsData[groupName].stats) {
          mcpFilesPathsData[groupName].stats.serversCount = totalServersCount
        }
      }

      return mcpFilesPathsData
    } catch (error) {
      throw new Error(`Failed to get MCP file groups: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse custom configuration files provided by the user
   * This method processes files independently of standard app-based discovery
   */
  async parseCustomFiles (filePaths: string[]): Promise<MCPFileGroupsResultRecord> {
    try {
      const mcpFilesPathsData: MCPFileGroupsResultRecord = {
        custom: {
          name: 'custom',
          friendlyName: 'Custom Files',
          paths: [],
          stats: { serversCount: 0 }
        }
      }

      let totalServersCount = 0

      for (const filePath of filePaths) {
        const resolvedPath = filePath.replace('~', process.env.HOME || '')
        const absolutePath = path.resolve(resolvedPath)

        try {
          // Check if file exists
          await fs.access(absolutePath)

          const parser = this.createParser(absolutePath)
          const parsable = await parser.isValidSyntax()

          const filePathData: MCPFilePath = {
            filePath: absolutePath,
            type: 'local',
            parsable
          }

          if (parsable) {
            const configData = await parser.parseConfigFile()
            const servers = await this.convertToMCPServerInfo(configData.servers || {})
            filePathData.servers = servers
            totalServersCount += servers.length
          } else {
            this.debug(`File ${absolutePath} has invalid syntax`)
            filePathData.servers = []
          }

          mcpFilesPathsData.custom.paths.push(filePathData)
        } catch (error) {
          // File does not exist or is not accessible
          this.debug(`Skipping file ${absolutePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          // Still add to paths with parsable=false to show user it was attempted
          mcpFilesPathsData.custom.paths.push({
            filePath: absolutePath,
            type: 'local',
            parsable: false,
            servers: []
          })
        }
      }

      if (mcpFilesPathsData.custom.stats) {
        mcpFilesPathsData.custom.stats.serversCount = totalServersCount
      }

      return mcpFilesPathsData
    } catch (error) {
      throw new Error(`Failed to parse custom files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Register a custom app with custom paths for the current OS
   */
  registerCustomApp (appName: string, paths: MCPFilePath[]): void {
    try {
      this.pathRegistry.registerCustomApp(this.currentOS, appName, paths)
    } catch (error) {
      throw new Error(`Failed to register custom app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse a configuration file and return server information
   */
  private async parseConfigFileForServers (filePath: string): Promise<MCPServerInfo[]> {
    try {
      const parser = this.createParser(filePath)
      const configData = await parser.parseConfigFile()
      return await this.convertToMCPServerInfo(configData.servers || {})
    } catch (error) {
      this.debug(`Failed to parse config file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  /**
   * Convert parsed server configs to MCPServerInfo format
   */
  private async convertToMCPServerInfo (servers: Record<string, any>): Promise<MCPServerInfo[]> {
    const serverInfos: MCPServerInfo[] = []

    for (const [serverName, serverConfig] of Object.entries(servers)) {
      if (serverConfig && typeof serverConfig === 'object') {
        // Determine the source: extract hostname from URL or use command
        let source: string
        if (serverConfig.url) {
          source = extractHostname(serverConfig.url)
        } else {
          source = serverConfig.command || ''
        }

        // Analyze version information for stdio servers
        const versionInfo = this.versionDetectionService.analyzeServerVersion(
          serverConfig.command || '',
          Array.isArray(serverConfig.args) ? serverConfig.args : undefined
        )

        serverInfos.push({
          name: serverName,
          command: serverConfig.command || '',
          args: Array.isArray(serverConfig.args) ? serverConfig.args : undefined,
          transport: serverConfig.type === 'streamable-http' ? 'http' : serverConfig.type, // Map streamable-http to http
          type: serverConfig.type,
          source,
          env: serverConfig.env,
          headers: serverConfig.headers,
          status: 'stopped', // Default status, will be updated by server manager
          versionInfo: versionInfo || undefined,
          credentials: CredentialDetectionService.analyzeServerConfig({
            env: serverConfig.env,
            args: serverConfig.args,
            headers: serverConfig.headers
          })
        })
      }
    }

    return serverInfos
  }

  /**
   * Get friendly name for an app
   */
  private getFriendlyName (appName: string): string {
    const friendlyNames: Record<string, string> = {
      claude: 'Claude Desktop',
      claude_code: 'Claude Code',
      cursor: 'Cursor',
      vscode: 'VS Code',
      cline: 'Cline',
      windsurf: 'Windsurf',
      roo: 'Roo',
      'intellij-github-copilot': 'IntelliJ GitHub Copilot',
      junie: 'IntelliJ Junie',
      zed: 'Zed',
      gemini: 'Gemini CLI'
    }

    return friendlyNames[appName] || appName
  }
}
