import { execSync } from 'node:child_process'
import { platform } from 'node:os'

interface MCPServerConfig {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse'
  env?: Record<string, string>
}

export class MCPServerManagerService {
  private name: string
  private command: string
  private args: string[]
  private transport?: 'stdio' | 'sse'
  private env?: Record<string, string>

  private running: boolean = false

  constructor (serverConfig: MCPServerConfig) {
    this.name = serverConfig.name
    this.command = serverConfig.command
    this.args = serverConfig.args || []
    this.transport = serverConfig.transport || 'stdio'
    this.env = serverConfig.env || {}
  }

  getName (): string {
    return this.name
  }

  getCmd (): string {
    return this.command
  }

  getArgs (): string[] {
    return this.args
  }

  getTransport (): 'stdio' | 'sse' | undefined {
    return this.transport
  }

  getEnv (): Record<string, string> | undefined {
    return this.env
  }

  isRunning (): boolean {
    try {
      let psOutput: string

      if (platform() === 'win32') {
        // Windows: Use wmic to get process info
        psOutput = execSync('wmic process get ProcessId,ParentProcessId,CommandLine /format:csv', {
          encoding: 'utf8',
          timeout: 5000
        })
      } else {
        // Unix/Linux/macOS: Use ps command with pid, ppid, and args
        psOutput = execSync('ps -eao pid,ppid,args', {
          encoding: 'utf8',
          timeout: 5000
        })
      }

      const processes = psOutput.trim().split('\n')

      for (const processLine of processes) {
        if (!processLine.trim()) continue

        let pid: string
        let ppid: string
        let commandLine: string

        if (platform() === 'win32') {
          // Parse Windows CSV format: Node,CommandLine,ParentProcessId,ProcessId
          const parts = processLine.split(',')
          if (parts.length < 4) continue
          commandLine = parts[1] || ''
          ppid = parts[2] || ''
          pid = parts[3] || ''
        } else {
          // Parse Unix ps output: PID PPID COMMAND
          const match = processLine.trim().match(/^\s*(\d+)\s+(\d+)\s+(.+)$/)
          if (!match) continue
          pid = match[1]
          ppid = match[2]
          commandLine = match[3]
        }

        if (this.isCommandMatch(commandLine, pid, ppid)) {
          return true
        }
      }

      return false
    } catch (error) {
      return false
    }
  }

  private isCommandMatch (commandLine: string, pid: string, ppid: string): boolean {
    const commandTokens = this.parseCommandLine(commandLine)

    // If no command tokens, cannot match
    if (commandTokens.length === 0) return false

    // Extracts the base command from the full command path of the process output list
    // e.g. "/usr/homebrew/bin/uv" extracted to "uv"
    const baseCommand = this.getBaseCommand(commandTokens[0])

    // Map configured command to actual process command for uvx case
    if (this.command === 'uvx' && baseCommand === 'uv') {
      return this.matchUvxProcess(commandTokens)
    }

    return false
    // Default matching strategy for other commands
    // const expectedArgs = [this.command, ...this.args]
    // return this.findCommandSequence(commandTokens, expectedArgs)
  }

  // @TODO refactor this to use path.basename or similar
  // to extract the base command from the full command path
  private getBaseCommand (fullCommandPath: string): string {
    // Extract base command name from full path
    const parts = fullCommandPath.split(/[/\\]/)
    return parts[parts.length - 1]
  }

  /*
  example1:
  ```
      "command": "uvx",
      "args": ["--from", "mcp-alchemy==2025.5.2.210242", "--with", "oracledb",
               "--refresh-package", "mcp-alchemy", "mcp-alchemy"],
  ```

  example 2:
  ```
      "command": "uvx",
      "args": [
        "mcp-neo4j-memory@0.1.4",
        "--db-url",
        "neo4j+s://xxxx.databases.neo4j.io",
        "--username",
        "<your-username>",
        "--password",
        "<your-password>"
      ]
  ```

  example 3:
  ```
    "vefaas": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/volcengine/mcp-server#subdirectory=server/mcp_server_vefaas_function",
        "mcp-server-vefaas-function"
      ],
      "env": {
        "VOLC_ACCESSKEY": "xxx",
        "VOLC_SECRETKEY": "xxx"
      }
    }
  }
  ```
  */
  private getUvxMcpServerNameFromArgs (): string | undefined {
    if (this.args.length === 0) return undefined

    let mcpServerName

    // If total args is 1 we know it is the MCP server name
    if (this.args.length === 1) {
      mcpServerName = this.args[0]
      return mcpServerName
    }

    // Extract the MCP server name from --from flag if it exists
    for (let i = 0; i < this.args.length; i++) {
      if (this.args[i] === '--from' && i + 1 < this.args.length) {
        mcpServerName = this.args[i + 1]
        return mcpServerName
      }
    }

    // If no use of --from flag, we try to extract the MCP server name from the last argument
    const firstArg = this.args[0]
    if (firstArg.startsWith('-') || firstArg.startsWith('--')) {
      // If the first argument is a flag, take the last argument as the MCP server name
      const lastArg = this.args[this.args.length - 1]
      mcpServerName = lastArg
      return mcpServerName
    }

    // If the first argument is not a flag, take it as the MCP server name
    mcpServerName = firstArg
    return mcpServerName
  }

  private matchUvxProcess (commandTokens: string[]): boolean {
    if (commandTokens.length === 0) return false

    // We already matched the base command as "uv" for uvx
    // Let's get the MCP server name from the args in command configuration
    const mcpServerName = this.getUvxMcpServerNameFromArgs()
    if (!mcpServerName) return false

    // Check if the command tokens contain the MCP server name
    // const expectedArgs = [mcpServerName, ...this.args]
    return this.findMcpServerNameInProcessArguments(commandTokens, mcpServerName)
  }

  private findMcpServerNameInProcessArguments (commandTokens: string[], mcpServerName: string): boolean {
    // Check if the command tokens contain the MCP server name
    for (let i = 0; i < commandTokens.length; i++) {
      const token = commandTokens[i]
      if (mcpServerName === token || token.includes(mcpServerName)) {
        // If we find the MCP server name in the command tokens, we consider it a match
        return true
      }
    }
    return false
  }

  private parseCommandLine (commandLine: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i]

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true
        quoteChar = char
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false
        quoteChar = ''
      } else if (!inQuotes && char === ' ') {
        if (current.trim()) {
          tokens.push(current.trim())
          current = ''
        }
      } else {
        current += char
      }
    }

    if (current.trim()) {
      tokens.push(current.trim())
    }

    return tokens
  }
}
