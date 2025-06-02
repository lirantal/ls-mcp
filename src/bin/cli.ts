// import { debuglog } from 'node:util'
import { MCPFiles } from '../main.ts'
import { RenderService } from '../services/render-service.ts'

interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse'
  env?: Record<string, string>
  status?: 'running' | 'stopped'
}

// Start the CLI with a new line for better readability
console.log()

// @TODO add debug logging
// const debug = debuglog('ls-mcp')

async function init () {
  const mcpFilesManager = new MCPFiles()
  const mcpFilesList = await mcpFilesManager.findFiles()

  if (Object.keys(mcpFilesList).length === 0) {
    console.log('No MCP files found.')
    return
  }

  let groupIndex = 0
  for (const groupName of Object.keys(mcpFilesList)) {
    groupIndex++
    const group = mcpFilesList[groupName]

    if (group.paths.length >= 0) {
      // handle file path list of MCP Servers
      for (const filePathData of group.paths) {
        const filePath = filePathData.filePath.replace('~', process.env.HOME || '')
        const filePathValid = filePathData.parsable ? 'VALID' : 'INVALID'
        const filePathDataType = filePathData.type.toUpperCase()
        const mcpServers = filePathData.servers || []

        const totalMCPServers = filePathData.servers ? filePathData.servers.length : 0
        const totalMCPServersRunning = mcpServers.filter((server: MCPServerInfo) => server.status === 'running').length

        const mcpGroupData = [
          { key: 'PROVIDER', value: group.friendlyName },
          { key: 'FILE', value: filePath },
          { key: 'TYPE', value: filePathDataType },
          { key: 'PARSABLE', value: filePathValid },
        ]

        const groupMetadata = {
          mcpServersTotal: totalMCPServers,
          mcpServersRunning: totalMCPServersRunning,
        }

        RenderService.printMcpGroup(groupIndex, mcpGroupData, groupMetadata)
        RenderService.printMcpServers(mcpServers)
      }
    } else {
      console.log('No files found in this group.')
    }
  }
}

init().then(() => {
  console.log('\n')
})
