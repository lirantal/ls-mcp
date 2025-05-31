import { debuglog } from 'node:util'
import { MCPFiles } from '../main.ts'
import { FormatterService } from '../utils/formatter-service.ts'
import { RenderService } from '../services/render-service.ts'

// Start the CLI with a new line for better readability
console.log()

const debug = debuglog('ls-mcp')

async function init () {
  const mcpFilesManager = new MCPFiles()
  const mcpFilesList = await mcpFilesManager.findFiles()

  const formatter = new FormatterService()

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

        const mcpGroupData = [
          { key: 'PROVIDER', value: group.friendlyName },
          { key: 'FILE', value: filePath },
          { key: 'STATUS', value: `${filePathValid} • ${filePathDataType} • ${filePathData.servers ? filePathData.servers.length : 0} MCP SERVERS` }
        ]

        const mcpServers = filePathData.servers || []

        RenderService.printMcpGroup(groupIndex, mcpGroupData)
        RenderService.printMcpServers(mcpServers)
      }
    } else {
      console.log('No files found in this group.')
    }
  }
}

await init()
console.log()
