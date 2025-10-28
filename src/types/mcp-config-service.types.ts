import type { MCPFilePath as AgentFilePath } from 'agent-files'

export interface MCPAppMetadata {
  name: string
  friendlyName: string
  paths: MCPFilePath[]
}

export interface MCPFilePath extends AgentFilePath {
  parsable?: boolean
  servers?: MCPServerInfo[]
}

export interface PackageVersionInfo {
  packageName: string
  version?: string
  isPinned: boolean
  isLatest: boolean
}

export interface MCPServerInfo {
  name: string
  command: string
  args?: string[]
  transport?: 'stdio' | 'sse' | 'http'
  type?: 'sse' | 'http' | 'stdio' | 'streamable-http'
  source?: string
  env?: Record<string, string>
  headers?: Record<string, string>
  status?: 'running' | 'stopped'
  versionInfo?: PackageVersionInfo
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
  riskLevel: 'low' | 'high'
  source?: 'env' | 'args' | 'headers'
}

export interface CredentialAnalysisResult {
  hasCredentials: boolean
  credentialVars: CredentialVariable[]
  riskLevel: 'none' | 'low' | 'high'
}
