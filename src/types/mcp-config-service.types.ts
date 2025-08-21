export interface MCPConfigData {
  raw: any
  parsed: boolean
  valid: boolean
  servers: Record<string, MCPServerConfig>
}

export interface MCPServerConfig {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http'
  type?: 'sse' | 'http' | 'stdio'
  env?: Record<string, string>
  credentials?: CredentialAnalysisResult
}

export interface MCPAppMetadata {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
}

export interface MCPFilePath {
  filePath: string
  type: 'local' | 'global'
  parsable?: boolean
  servers?: MCPServerInfo[]
}

export interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http'
  type?: 'sse' | 'http' | 'stdio'
  source?: string
  env?: Record<string, string>
  status?: 'running' | 'stopped'
  credentials?: CredentialAnalysisResult
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
export type MCPFileGroupsResultRecord = Record<string, MCPFileGroups>
export type MCPAppPathsRecord = Record<string, MCPFilePath[]>

// Credential detection types
export interface CredentialVariable {
  name: string
  value: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface CredentialAnalysisResult {
  hasCredentials: boolean
  credentialVars: CredentialVariable[]
  riskLevel: 'none' | 'low' | 'medium' | 'high'
}
