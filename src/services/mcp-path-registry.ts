import path from 'node:path'
import { type MCPAppPathsRecord, type MCPFilePath } from '../types/mcp-config-service.types.js'

export class MCPPathRegistry {
  private static readonly WINDOWS_PATHS: MCPAppPathsRecord = {
    claude: [
      { filePath: path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'), type: 'global' }
    ],
    claude_code: [
      { filePath: '.mcp.json', type: 'local' }
    ],
    cursor: [
      { filePath: path.join(process.env.HOME || '', '.cursor', 'mcp.json'), type: 'global' },
      { filePath: path.join('.cursor', 'mcp.json'), type: 'local' }
    ],
    vscode: [
      { filePath: path.join('.vscode', 'mcp.json'), type: 'local' },
      { filePath: path.join(process.env.APPDATA || '', 'Code', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(process.env.APPDATA || '', 'Code - Insiders', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(process.env.APPDATA || '', 'Code', 'User', 'mcp.json'), type: 'global' },
      { filePath: path.join(process.env.APPDATA || '', 'Code - Insiders', 'User', 'mcp.json'), type: 'global' }
    ],
    cline: [
      { filePath: path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(process.env.APPDATA || '', 'Code - Insiders', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    windsurf: [
      { filePath: path.join('.codeium', 'windsurf', 'mcp_config.json'), type: 'local' }
    ],
    roo: [
      { filePath: path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(process.env.APPDATA || '', 'Code - Insiders', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    'intellij-github-copilot': [
      { filePath: path.join(process.env.LOCALAPPDATA || '', 'github-copilot', 'intellij', 'mcp.json'), type: 'global' }
    ],
    junie: [
      { filePath: path.join(process.env.HOME || '', '.junie', 'mcp', 'mcp.json'), type: 'global' }
    ],
    zed: [
      { filePath: path.join(process.env.LOCALAPPDATA || '', 'zed', 'settings.json'), type: 'global' },
      { filePath: path.join('.zed', 'settings.json'), type: 'local' }
    ],
    gemini: [
      { filePath: path.join(process.env.HOME || '', '.gemini', 'settings.json'), type: 'global' },
      { filePath: path.join('.gemini', 'settings.json'), type: 'local' }
    ]
  }

  private static readonly DARWIN_PATHS: MCPAppPathsRecord = {
    claude: [
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), type: 'global' }
    ],
    claude_code: [
      { filePath: '.mcp.json', type: 'local' }
    ],
    cursor: [
      { filePath: path.join(process.env.HOME || '', '.cursor', 'mcp.json'), type: 'global' },
      { filePath: path.join('.cursor', 'mcp.json'), type: 'local' }
    ],
    vscode: [
      { filePath: path.join('.vscode', 'mcp.json'), type: 'local' },
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code', 'User', 'mcp.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code - Insiders', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code - Insiders', 'User', 'mcp.json'), type: 'global' }
    ],
    cline: [
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code - Insiders', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    windsurf: [
      { filePath: path.join('.codeium', 'windsurf', 'mcp_config.json'), type: 'local' }
    ],
    roo: [
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code - Insiders', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    'intellij-github-copilot': [
      { filePath: path.join(process.env.HOME || '', '.config', 'github-copilot', 'intellij', 'mcp.json'), type: 'global' }
    ],
    junie: [
      { filePath: path.join(process.env.HOME || '', '.junie', 'mcp', 'mcp.json'), type: 'global' },
      { filePath: path.join('.junie', 'mcp', 'mcp.json'), type: 'local' }
    ],
    zed: [
      { filePath: path.join(process.env.HOME || '', '.config', 'zed', 'settings.json'), type: 'global' },
      { filePath: path.join('.zed', 'settings.json'), type: 'local' }
    ],
    gemini: [
      { filePath: path.join(process.env.HOME || '', '.gemini', 'settings.json'), type: 'global' },
      { filePath: path.join('.gemini', 'settings.json'), type: 'local' }
    ]
  }

  private static readonly LINUX_PATHS: MCPAppPathsRecord = {
    claude: [
      { filePath: path.join(process.env.HOME || '', '.config', 'Claude', 'claude_desktop_config.json'), type: 'global' }
    ],
    claude_code: [
      { filePath: '.mcp.json', type: 'local' }
    ],
    cursor: [
      { filePath: path.join(process.env.HOME || '', '.cursor', 'mcp.json'), type: 'global' },
      { filePath: path.join('.cursor', 'mcp.json'), type: 'local' }
    ],
    vscode: [
      { filePath: path.join('.vscode', 'mcp.json'), type: 'local' },
      { filePath: path.join(process.env.HOME || '', '.config', 'Code', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', '.config', 'Code - Insiders', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', '.config', 'Code', 'User', 'mcp.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', '.config', 'Code - Insiders', 'User', 'mcp.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', '.mcp.json'), type: 'global' }
    ],
    cline: [
      { filePath: path.join(process.env.HOME || '', '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', '.config', 'Code - Insiders', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    windsurf: [
      { filePath: path.join('.codeium', 'windsurf', 'mcp_config.json'), type: 'local' }
    ],
    roo: [
      { filePath: path.join(process.env.HOME || '', '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(process.env.HOME || '', '.config', 'Code - Insiders', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    'intellij-github-copilot': [
      { filePath: path.join(process.env.HOME || '', '.config', 'github-copilot', 'intellij', 'mcp.json'), type: 'global' }
    ],
    junie: [
      { filePath: path.join(process.env.HOME || '', '.junie', 'mcp.json'), type: 'global' },
      { filePath: path.join('.junie', 'mcp', 'mcp.json'), type: 'local' }
    ],
    zed: [
      { filePath: path.join(process.env.HOME || '', '.config', 'zed', 'settings.json'), type: 'global' },
      { filePath: path.join('.zed', 'settings.json'), type: 'local' }
    ],
    gemini: [
      { filePath: path.join(process.env.HOME || '', '.gemini', 'settings.json'), type: 'global' },
      { filePath: path.join('.gemini', 'settings.json'), type: 'local' }
    ]
  }

  private customApps: Map<string, MCPAppPathsRecord> = new Map()

  /**
   * Get all MCP configuration file paths for a specific operating system
   */
  getPathsForOS (os: string): MCPAppPathsRecord {
    switch (os.toLowerCase()) {
      case 'win32':
      case 'windows':
        return { ...MCPPathRegistry.WINDOWS_PATHS }
      case 'darwin':
      case 'macos':
        return { ...MCPPathRegistry.DARWIN_PATHS }
      case 'linux':
        return { ...MCPPathRegistry.LINUX_PATHS }
      default:
        throw new Error(`Unsupported operating system: ${os}`)
    }
  }

  /**
   * Get MCP configuration file paths for a specific app on a specific OS
   */
  getPathsForApp (os: string, appName: string): MCPFilePath[] {
    const osPaths = this.getPathsForOS(os)
    const appPaths = osPaths[appName]

    if (!appPaths) {
      throw new Error(`App '${appName}' not found for OS '${os}'`)
    }

    return [...appPaths]
  }

  /**
   * Get all supported app names for a specific OS
   */
  getSupportedApps (os: string): string[] {
    const osPaths = this.getPathsForOS(os)
    return Object.keys(osPaths)
  }

  /**
   * Get all supported operating systems
   */
  getSupportedOperatingSystems (): string[] {
    return ['win32', 'darwin', 'linux']
  }

  /**
   * Register a custom app with custom paths for a specific OS
   */
  registerCustomApp (os: string, appName: string, paths: MCPFilePath[]): void {
    if (!this.customApps.has(os)) {
      this.customApps.set(os, {})
    }

    const osCustomApps = this.customApps.get(os)!
    osCustomApps[appName] = [...paths]
  }

  /**
   * Get paths including custom registered apps
   */
  getPathsForOSWithCustom (os: string): MCPAppPathsRecord {
    const basePaths = this.getPathsForOS(os)
    const customPaths = this.customApps.get(os) || {}

    return { ...basePaths, ...customPaths }
  }
}
