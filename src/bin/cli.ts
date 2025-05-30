import { debuglog } from 'node:util'
import { MCPFiles } from '../main.ts'
import { FormatterService } from '../utils/formatter-service.ts'

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

  for (const groupName of Object.keys(mcpFilesList)) {
    const group = mcpFilesList[groupName]
    console.log(`\n${group.friendlyName} (${group.name}) (${group.stats.serversCount} total servers):`)
    if (group.paths.length >= 0) {
      group.paths.forEach(filePathData => {
        const filePath = filePathData.filePath.replace('~', process.env.HOME || '')
        console.log(`- ${formatter.filePathToTerminal(filePath)} (${filePathData.type}) (${filePathData.parsable ? 'valid' : 'invalid'})`)
      })
    } else {
      console.log('No files found in this group.')
    }
  }
}

await init()
console.log()
