import { MCPConfigService } from './services/mcp-config-service.js'
import { MCPServerManagerService } from './services/mcp-server-manager-service.js'
import { type MCPFileGroupsResultRecord } from './types/mcp-config-service.types.js'

export class MCPFiles {
  private mcpConfigService: MCPConfigService

  constructor () {
    this.mcpConfigService = new MCPConfigService()
  }

  /**
   * Find and process all MCP configuration files
   */
  async findFiles (): Promise<MCPFileGroupsResultRecord> {
    try {
      // Get MCP file groups with basic server information
      const mcpFilesPathsData = await this.mcpConfigService.getMCPFileGroups()

      // Process each group to add server status information
      for (const groupName of Object.keys(mcpFilesPathsData)) {
        const group = mcpFilesPathsData[groupName]

        for (const filePathData of group.paths) {
          if (filePathData.servers && filePathData.servers.length > 0) {
            // Update server status for each server in this file
            for (const server of filePathData.servers) {
              const serverConfig = {
                name: server.name,
                command: server.command,
                args: server.args,
                transport: server.transport === 'http' ? 'sse' : server.transport, // MCPServerManagerService only supports 'stdio' | 'sse'
                type: server.type,
                env: server.env
              }

              const serverManager = new MCPServerManagerService(serverConfig)
              const processDetection = serverManager.isRunning()

              // Determine if the server is running
              let isRunning = false
              if (processDetection) {
                if (typeof processDetection === 'object' && processDetection.estimatedProduct === group.name) {
                  isRunning = true
                }
              }

              server.status = isRunning ? 'running' : 'stopped'
            }
          }
        }
      }

      return mcpFilesPathsData
    } catch (error) {
      throw new Error(`Failed to find MCP files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get MCP configuration service instance for advanced operations
   */
  getMCPConfigService (): MCPConfigService {
    return this.mcpConfigService
  }
}
