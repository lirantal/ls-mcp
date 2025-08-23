import fs from 'node:fs/promises'
import { parse } from 'jsonc-parser'
import { type MCPConfigData, type MCPServerConfig } from '../types/mcp-config-service.types.js'

export class MCPConfigParser {
  private filePath: string
  private fileContents: string | null = null
  private parsed: boolean = false
  private valid: boolean = false
  private fileContentsData: any | null = null

  constructor (filePath: string) {
    this.filePath = filePath
  }

  /**
   * Parse the configuration file and return structured data
   */
  async parseConfigFile (): Promise<MCPConfigData> {
    if (this.parsed) {
      return {
        raw: this.fileContentsData,
        parsed: this.parsed,
        valid: this.valid,
        servers: await this.extractMCPServers(this.fileContentsData)
      }
    }

    this.parsed = true
    const fileContent = await this.getFileContent()

    // Try parsing as standard JSON first
    try {
      this.fileContentsData = JSON.parse(fileContent)
      if (typeof this.fileContentsData === 'object') {
        this.valid = true
      }
    } catch (e) {
      // Ignore JSON parse errors, try JSONC next
    }

    // Try parsing as JSONC if standard JSON failed
    if (!this.valid) {
      try {
        this.fileContentsData = parse(fileContent)
        if (typeof this.fileContentsData === 'object') {
          this.valid = true
        }
      } catch (error) {
        // Ignore JSONC parse errors
      }
    }

    // @TODO: Add support for YAML and other formats in the future

    if (!this.valid) {
      throw new Error(`Failed to parse configuration file: ${this.filePath}`)
    }

    return {
      raw: this.fileContentsData,
      parsed: this.parsed,
      valid: this.valid,
      servers: await this.extractMCPServers(this.fileContentsData)
    }
  }

  /**
   * Extract MCP servers from parsed configuration data
   */
  async extractMCPServers (configData: any): Promise<Record<string, MCPServerConfig>> {
    if (!configData || typeof configData !== 'object') {
      return {}
    }

    // VS Code uses `servers`
    if (configData.servers && typeof configData.servers === 'object') {
      return this.normalizeServerConfigs(configData.servers)
    }

    // VS Code global settings.json file uses `mcp` -> `servers`
    if (configData.mcp?.servers && typeof configData.mcp.servers === 'object') {
      return this.normalizeServerConfigs(configData.mcp.servers)
    }

    // Claude and Cursor use the `mcpServers` key
    if (configData.mcpServers && typeof configData.mcpServers === 'object') {
      return this.normalizeServerConfigs(configData.mcpServers)
    }

    // Zed uses `context_servers` key
    if (configData.context_servers && typeof configData.context_servers === 'object') {
      return this.normalizeServerConfigs(configData.context_servers)
    }

    return {}
  }

  /**
   * Normalize server configurations to ensure consistent structure
   */
  private normalizeServerConfigs (servers: Record<string, any>): Record<string, MCPServerConfig> {
    const normalized: Record<string, MCPServerConfig> = {}

    for (const [serverName, serverConfig] of Object.entries(servers)) {
      if (serverConfig && typeof serverConfig === 'object') {
        const env = serverConfig.env && typeof serverConfig.env === 'object' ? serverConfig.env : undefined

        normalized[serverName] = {
          name: serverName,
          command: serverConfig.command || '',
          args: Array.isArray(serverConfig.args) ? serverConfig.args : undefined,
          type: this.validateType(serverConfig.type) ? serverConfig.type : this.inferTransportType(serverConfig),
          url: serverConfig.url,
          env
        }
      }
    }

    return normalized
  }

  /**
   * Validate type value
   */
  private validateType (type: any): type is 'sse' | 'http' | 'stdio' | 'streamable-http' {
    return ['sse', 'http', 'stdio', 'streamable-http'].includes(type)
  }

  /**
   * Infer transport type from server configuration when type field is not explicitly set
   */
  private inferTransportType (serverConfig: any): 'sse' | 'http' | 'stdio' | undefined {
    // Rule 1: If URL is present, infer HTTP transport
    if (serverConfig.url && typeof serverConfig.url === 'string') {
      return 'http'
    }

    // Rule 2-4: Search through args array for transport indicators
    if (Array.isArray(serverConfig.args)) {
      const argsString = serverConfig.args.join(' ').toLowerCase()

      // Check for stdio indicators
      if (argsString.includes('stdio')) {
        return 'stdio'
      }

      // Check for HTTP indicators
      if (argsString.includes('http')) {
        return 'http'
      }

      // Check for SSE indicators
      if (argsString.includes('sse')) {
        return 'sse'
      }
    }

    // Rule 5: Default to stdio if command is present but no other indicators found
    // This is a reasonable default since most MCP servers use stdio transport
    if (serverConfig.command && typeof serverConfig.command === 'string') {
      return 'stdio'
    }

    // No transport type could be inferred
    return undefined
  }

  /**
   * Validate server configuration
   */
  validateServerConfig (serverConfig: MCPServerConfig): boolean {
    if (!serverConfig || typeof serverConfig !== 'object') {
      return false
    }

    if (!serverConfig.name || typeof serverConfig.name !== 'string') {
      return false
    }

    if (!serverConfig.command || typeof serverConfig.command !== 'string') {
      return false
    }

    return true
  }

  /**
   * Get supported configuration keys that the parser recognizes
   */
  getSupportedConfigKeys (): string[] {
    return ['servers', 'mcp.servers', 'mcpServers', 'context_servers']
  }

  /**
   * Check if the configuration file has valid syntax
   */
  async isValidSyntax (): Promise<boolean> {
    try {
      const configData = await this.parseConfigFile()
      return configData.valid
    } catch (error) {
      return false
    }
  }

  /**
   * Count the number of MCP servers in the configuration
   */
  async countMCPServers (): Promise<number> {
    try {
      const configData = await this.parseConfigFile()
      return Object.keys(configData.servers).length
    } catch (error) {
      return 0
    }
  }

  /**
   * Get the raw file content
   */
  private async getFileContent (): Promise<string> {
    if (this.fileContents) {
      return this.fileContents
    }

    try {
      this.fileContents = await fs.readFile(this.filePath, 'utf-8')
      return this.fileContents
    } catch (error) {
      throw new Error(`Failed to read file: ${this.filePath}`)
    }
  }
}
