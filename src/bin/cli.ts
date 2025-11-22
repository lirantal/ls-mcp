#!/usr/bin/env node

import { styleText } from 'node:util'
import { MCPFiles } from '../main.ts'
import { RenderService } from '../services/render-service.ts'

interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http'
  type?: 'sse' | 'http' | 'stdio' | 'streamable-http'
  source?: string
  env?: Record<string, string>
  status?: 'running' | 'stopped'
  credentials?: any
}

// Parse command-line arguments
const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')
const showAll = args.includes('--all') || args.includes('-a')

// Parse --files flag
let customFiles: string[] | undefined
const filesIndex = args.findIndex(arg => arg === '--files')
if (filesIndex !== -1 && filesIndex < args.length - 1) {
  // Get all arguments after --files until we hit another flag or end of args
  const fileArgs: string[] = []
  for (let i = filesIndex + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      break
    }
    fileArgs.push(args[i])
  }

  // Support both comma-separated and space-separated file paths
  customFiles = fileArgs.flatMap(arg =>
    arg.includes(',') ? arg.split(',').map(f => f.trim()) : [arg.trim()]
  ).filter(f => f.length > 0)
}

async function init () {
  // Start the CLI with a new line for better readability (only in non-JSON mode)
  if (!jsonOutput) {
    console.log()
    if (customFiles && customFiles.length > 0) {
      console.log('[+] Analyzing specified MCP configuration files...')
    } else {
      console.log('[+] Detecting MCP Server configurations...')
    }
  }

  const mcpFilesManager = new MCPFiles(customFiles)
  const mcpFilesList = await mcpFilesManager.findFiles()

  if (Object.keys(mcpFilesList).length === 0) {
    exitWithError('No configuration for MCP Server applications found.')
  }

  let pathIndex = 0
  let totalServers = 0
  let totalRunning = 0
  let totalHighRiskCredentials = 0
  let totalImplicitLatestVersions = 0
  const transportCounts = { stdio: 0, sse: 0, http: 0 }

  for (const groupName of Object.keys(mcpFilesList)) {
    const group = mcpFilesList[groupName]

    // Skip groups with zero servers unless --all is specified or in --files mode
    const isCustomFilesMode = customFiles && customFiles.length > 0
    const shouldSkipGroup = !showAll && !isCustomFilesMode && (group.stats?.serversCount === 0)
    if (shouldSkipGroup) {
      continue
    }

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

        // Accumulate summary statistics
        totalServers += totalMCPServers
        totalRunning += totalMCPServersRunning

        // Count transport types
        for (const server of mcpServers) {
          // transport field is always populated from type field in the data layer
          if (server.transport) {
            const transport = server.transport.toLowerCase()
            if (transport in transportCounts) {
              transportCounts[transport as keyof typeof transportCounts]++
            }
          }

          // Count high-risk credentials
          if (server.credentials?.hasCredentials && server.credentials?.riskLevel === 'high') {
            totalHighRiskCredentials++
          }

          // Count implicit latest versions
          if (server.versionInfo?.isLatest) {
            totalImplicitLatestVersions++
          }
        }

        // Only render in non-JSON mode
        if (!jsonOutput) {
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
  }

  if (pathIndex === 0) {
    const isCustomFilesMode = customFiles && customFiles.length > 0
    if (isCustomFilesMode) {
      exitWithError('No MCP servers found in specified configuration files.')
    } else {
      exitWithError('No MCP servers found in known configuration files.')
    }
  }

  // Prepare summary statistics
  const summaryStats = {
    totalServers,
    runningServers: totalRunning,
    highRiskCredentials: totalHighRiskCredentials,
    implicitLatestVersions: totalImplicitLatestVersions,
    transportBreakdown: transportCounts
  }

  // Output based on mode
  if (jsonOutput) {
    // Filter out providers with zero servers unless --all is specified or in --files mode
    const isCustomFilesMode = customFiles && customFiles.length > 0
    const filteredMcpFiles = Object.fromEntries(
      Object.entries(mcpFilesList).filter(([, group]) => {
        if (showAll || isCustomFilesMode) {
          return group.paths.length > 0
        }
        return (group.stats?.serversCount ?? 0) > 0
      })
    )

    const output = {
      mcpFiles: filteredMcpFiles,
      summary: summaryStats
    }
    console.log(JSON.stringify(output, null, 2))
  } else {
    RenderService.printSummary(summaryStats)
  }
}

init().then(() => {
  console.log('\n')
})

function exitWithError (message: string) {
  console.error(`${styleText(['red'], '●')} ${message}\n`)
  process.exit(1)
}
