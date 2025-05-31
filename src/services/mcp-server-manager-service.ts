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
    return this.running
  }
}
