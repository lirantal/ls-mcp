import { execSync } from 'node:child_process'
import { platform } from 'node:os'

interface MCPServerConfig {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse'
  env?: Record<string, string>
}

interface MatchedProcess {
  pid: string
  commandLine: string
  ppid?: string
  parentCommandLine?: string
  estimatedVendor?: string
  estimatedProduct?: string
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

  isRunning (): boolean | MatchedProcess {
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

      const processMap = new Map<string, { ppid: string, commandTokens: string[] }>()
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

        // Parse command line and store in map
        const commandTokens = this.parseCommandLine(commandLine)
        if (commandTokens.length > 0) {
          processMap.set(pid, { ppid, commandTokens })
        }
      }

      // Then iterate the map to check for matches
      for (const [pid, processData] of processMap) {
        if (this.isCommandMatch(processData.commandTokens, pid, processData.ppid)) {
          // if we matched the command let's extract the parent command information
          const parentProcess = processMap.get(processData.ppid)
          let vendorInfo = {}
          if (parentProcess) {
            const { estimatedVendor, estimatedProduct } = this.getVendorFromCommand(parentProcess.commandTokens) || {}
            vendorInfo = {
              parentCommandLine: parentProcess.commandTokens.join(' '),
              estimatedVendor,
              estimatedProduct
            }
          }

          return {
            pid,
            commandLine: processData.commandTokens.join(' '),
            ppid: processData.ppid,
            ...vendorInfo
          }
        }
      }

      return false
    } catch (error) {
      return false
    }
  }

  private getVendorFromCommand (commandTokens: string[]): { estimatedVendor: string, estimatedProduct: string } | undefined {
    // match based on known vendor patterns in the command string
    const commandString = commandTokens.join(' ').toLowerCase()
    if (commandString.includes('claude.app')) {
      return {
        estimatedVendor: 'anthropic',
        estimatedProduct: 'claude-desktop'
      }
    }

    if (commandString.includes('claude')) {
      return {
        estimatedVendor: 'anthropic',
        estimatedProduct: 'claude-desktop'
      }
    }
  }

  private isCommandMatch (commandTokens: string[], pid: string, ppid: string): boolean {
    // If no command tokens, cannot match
    if (commandTokens.length === 0) return false

    // Extracts the base command from the full command path of the process output list
    // e.g. "/usr/homebrew/bin/uv" extracted to "uv"
    const baseCommand = this.getBaseCommand(commandTokens[0])

    // Map configured command to actual process command for uvx case
    if (this.command === 'uvx' && baseCommand === 'uv') {
      return this.matchUvxProcess(commandTokens)
    }

    // Map configured command to actual process command for npx case
    if (this.command === 'npx' && baseCommand === 'npm') {
      return this.matchNpxProcess(commandTokens)
    }

    /*
    example config:
      "test_server_2": {
        "command": "uv",
        "args": [
          "--directory",
          "/Users/lirantal/projects/repos/example-python-mcp-server",
          "run",
          "test-server.py"
        ]
      },
    */
    if (this.command === 'uv' && baseCommand === 'uv') {
      return this.matchGenericArgsToArgs(commandTokens)
    }

    // Python Generic commands matching
    /*
    example config:
        "test_server": {
          "command": "/Users/lirantal/projects/repos/example-python-mcp-server/.venv/bin/python",
          "args": [
            "/Users/lirantal/projects/repos/example-python-mcp-server/test-server.py"
          ]
        }
    */
    const commandConfigPythonBase: string = this.getBaseCommand(this.command)
    const commandAliasesPython = ['python3', 'python', 'python3.10', 'python3.11', 'python3.12', 'cpython3', 'cpython', 'python3', 'python2']
    if (commandAliasesPython.includes(commandConfigPythonBase) && commandAliasesPython.includes(baseCommand)) {
      return this.matchGenericArgsToArgs(commandTokens)
    }

    return false
  }

  private matchGenericArgsToArgs (commandTokens: string[]): boolean {
    if (this.args.length === 0) {
      // If no args configured, we just check if the command matches
      return commandTokens[0] === this.command
    }

    if (commandTokens.length < 2) {
      // If there are no command tokens or only the command itself, we cannot match
      return false
    }

    // Remove the command from the command tokens
    const commandWithoutArgs = commandTokens.slice(1)

    for (let i = 0; i < this.args.length; i++) {
      // If we reach the end of command tokens, we cannot match
      if (i >= commandWithoutArgs.length) return false

      const arg = this.args[i]
      const token = commandWithoutArgs[i]

      // Check if the argument matches the command token
      if (arg !== token && !token.includes(arg)) {
        return false
      }
    }

    // If we reached here, we matched all arguments
    return true
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

  example 4:
  ```
      "time": {
      "command": "uvx",
      "args": ["mcp-server-time", "--local-timezone=America/New_York"]
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

  /*
    example to match:
    ```
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost/mydb"
      ]
    }
    ```

    with a process command like:
    ```
      npm exec @modelcontextprotocol/server-postgres postgresql://localhost/mydb
    ```
  */
  private matchNpxProcess (commandTokens: string[]): boolean {
    // npx command pattern: npm exec <package> [args...]
    // Expected command tokens: ["npm", "exec", package_name, ...args]

    if (commandTokens.length < 3) return false

    // Check if it's the expected npm exec pattern
    if (commandTokens[1] !== 'exec') return false

    let argsToMatch: string[] = []
    const yIndex = this.args.indexOf('-y')

    if (yIndex !== -1 && yIndex + 1 < this.args.length) {
      // Case 1: -y flag is present, extract args after it
      argsToMatch = this.args.slice(yIndex + 1)
    } else {
      // Case 2: No -y flag, match all args directly
      argsToMatch = this.args
    }

    // Match the args after "npm exec" with the extracted args from config
    // commandTokens: ["npm", "exec", package_name, ...additional_args]
    // argsToMatch: [package_name, ...additional_args]

    if (commandTokens.length - 2 !== argsToMatch.length) {
      // Length mismatch between process args and config args
      return false
    }

    // Compare each argument starting from position 2 in commandTokens
    for (let i = 0; i < argsToMatch.length; i++) {
      const commandToken = commandTokens[i + 2] // Start from index 2 (after "npm exec")
      const expectedArg = argsToMatch[i]

      if (commandToken !== expectedArg) {
        return false
      }
    }

    return true
  }
}
