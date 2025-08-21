import { platform } from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { MCPPathRegistry } from './mcp-path-registry.js'
import { MCPConfigParser } from './mcp-config-parser.js'
import {
  type MCPAppPathsRecord,
  type MCPFilePath,
  type MCPServerInfo,
  type MCPAppMetadata,
  type MCPFilePathGroupsRecord,
  type MCPFileGroupsResultRecord
} from '../types/mcp-config-service.types.js'

export class MCPConfigService {
  private pathRegistry: MCPPathRegistry
  private currentOS: string

  constructor () {
    this.pathRegistry = new MCPPathRegistry()
    this.currentOS = platform()
  }

  /**
   * Get MCP configuration files for a specific AI application on the current OS
   */
  getConfigFilesPerApp (appName: string): MCPFilePath[] {
    try {
      return this.pathRegistry.getPathsForApp(this.currentOS, appName)
    } catch (error) {
      throw new Error(`Failed to get config files for app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get MCP configuration files for all AI applications on the current OS
   */
  getAllConfigFiles (): MCPAppPathsRecord {
    try {
      return this.pathRegistry.getPathsForOS(this.currentOS)
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
          console.debug(`Failed to get servers for app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        paths: appPaths[appName] || []
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

      for (const [groupName, paths] of Object.entries(appPaths)) {
        mcpFilesPathsData[groupName] = {
          name: groupName,
          friendlyName: this.getFriendlyName(groupName),
          paths: [],
          stats: { serversCount: 0 }
        }

        const uniqueFilePaths = new Set<string>()
        let totalServersCount = 0

        for (const filePathData of paths) {
          const resolvedPath = filePathData.filePath.replace('~', process.env.HOME || '')
          const absolutePath = path.resolve(resolvedPath)

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
              const servers = await this.convertToMCPServerInfo(configData.servers)
              filePathData.servers = servers
              totalServersCount += servers.length
            }

            mcpFilesPathsData[groupName].paths.push(filePathData)
          } catch (error) {
            // File does not exist or is not accessible, continue to next
            console.debug(`Skipping file ${resolvedPath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }

        mcpFilesPathsData[groupName].stats.serversCount = totalServersCount
      }

      return mcpFilesPathsData
    } catch (error) {
      throw new Error(`Failed to get MCP file groups: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      return await this.convertToMCPServerInfo(configData.servers)
    } catch (error) {
      console.debug(`Failed to parse config file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        serverInfos.push({
          name: serverName,
          command: serverConfig.command || '',
          args: Array.isArray(serverConfig.args) ? serverConfig.args : undefined,
          transport: serverConfig.transport,
          type: serverConfig.type,
          source: serverConfig.command || '',
          env: serverConfig.env,
          status: 'stopped' // Default status, will be updated by server manager
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
