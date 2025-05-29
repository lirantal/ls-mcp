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

  if (mcpFilesList.length > 0) {
    console.log('MCP files found:')
    mcpFilesList.forEach(filePath => {
      console.log(`- ${formatter.filePathToTerminal(filePath)}`)
    })
  } else {
    console.log('No MCP files found.')
  }
}

init()
