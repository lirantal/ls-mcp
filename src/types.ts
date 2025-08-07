export interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http',
  type?: 'sse' | 'http' | 'stdio'
  source?: string
  env?: Record<string, string>
  status?: 'running' | 'stopped'
}

export interface MCPFilePath {
  filePath: string
  type: 'local' | 'global'
  parsable?: boolean
  servers?: MCPServerInfo[]
}

export interface MCPFileGroups {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
  stats?: {
    serversCount?: number
  }
}

export interface MCPFileGroupsResult {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
  stats: {
    serversCount?: number
  }
}

export type MCPFilePathGroupsRecord = Record<string, MCPFileGroups>
export type MCPFileGroupsResultRecord = Record<string, MCPFileGroupsResult>
