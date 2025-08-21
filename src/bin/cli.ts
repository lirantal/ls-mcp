#!/usr/bin/env node

import { styleText } from 'node:util'
import { MCPFiles } from '../main.ts'
import { RenderService } from '../services/render-service.ts'

interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http'
  type?: 'sse' | 'http' | 'stdio'
  source?: string
  env?: Record<string, string>
  status?: 'running' | 'stopped'
}

async function init () {
  // Start the CLI with a new line for better readability
  console.log()
  console.log('[+] Detecting MCP Server configurations...')

  const mcpFilesManager = new MCPFiles()
  const mcpFilesList = await mcpFilesManager.findFiles()

  if (Object.keys(mcpFilesList).length === 0) {
    exitWithError('No configuration for MCP Server applications found.')
  }

  let pathIndex = 0
  for (const groupName of Object.keys(mcpFilesList)) {
    const group = mcpFilesList[groupName]

    if (group.paths.length > 0) {
      // handle file path list of MCP Servers
      for (const filePathData of group.paths) {
        pathIndex++

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

        RenderService.printMcpGroup(pathIndex, mcpGroupData, groupMetadata)
        RenderService.printMcpServers(mcpServers)
      }
    }
  }

  if (pathIndex === 0) {
    exitWithError('No MCP servers found in known configuration files.')
  }
}

init().then(() => {
  console.log('\n')
})

function exitWithError (message: string) {
  console.error(`${styleText(['red'], '●')} ${message}\n`)
  process.exit(1)
}
