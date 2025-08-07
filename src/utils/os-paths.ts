import path from 'node:path'
import { type MCPFilePath } from '../types.ts'

const appData = process.env.APPDATA || ''
const localAppData = process.env.LOCALAPPDATA || ''
const homeDir = process.env.HOME || ''

export function getWindowsPaths (): Record<string, MCPFilePath[]> {
  return {
    claude: [
      { filePath: path.join(appData, 'Claude', 'claude_desktop_config.json'), type: 'global' }
    ],
    claude_code: [
      { filePath: '.mcp.json', type: 'local' }
    ],
    cursor: [
      { filePath: path.join(homeDir, '.cursor', 'mcp.json'), type: 'global' },
      { filePath: path.join('.cursor', 'mcp.json'), type: 'local' }
    ],
    vscode: [
      { filePath: path.join('.vscode', 'mcp.json'), type: 'local' },
      { filePath: path.join(appData, 'Code', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(appData, 'Code - Insiders', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(appData, 'Code', 'User', 'mcp.json'), type: 'global' },
      { filePath: path.join(appData, 'Code - Insiders', 'User', 'mcp.json'), type: 'global' }
    ],
    cline: [
      { filePath: path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(appData, 'Code - Insiders', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    windsurf: [
      { filePath: path.join('.codeium', 'windsurf', 'mcp_config.json'), type: 'local' },
    ],
    roo: [
      { filePath: path.join(appData, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(appData, 'Code - Insiders', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
    ],
    'intellij-github-copilot': [
      { filePath: path.join(localAppData, 'github-copilot', 'intellij', 'mcp.json'), type: 'global' },
    ],
    junie: [
      { filePath: path.join(homeDir, '.junie', 'mcp', 'mcp.json'), type: 'global' },
    ],
    zed: [
      { filePath: path.join(localAppData, 'zed', 'settings.json'), type: 'global' },
      { filePath: path.join('.zed', 'settings.json'), type: 'local' }
    ],
    gemini: [
      { filePath: path.join(homeDir, '.gemini', 'settings.json'), type: 'global' },
      { filePath: path.join('.gemini', 'settings.json'), type: 'local' }
    ]
  }
}

export function getDarwinPaths (): Record<string, MCPFilePath[]> {
  return {
    claude: [
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), type: 'global' }
    ],
    claude_code: [
      { filePath: '.mcp.json', type: 'local' }
    ],
    cursor: [
      { filePath: path.join(homeDir, '.cursor', 'mcp.json'), type: 'global' },
      { filePath: path.join('.cursor', 'mcp.json'), type: 'local' }
    ],
    vscode: [
      { filePath: path.join('.vscode', 'mcp.json'), type: 'local' },
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'mcp.json'), type: 'global' },
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code - Insiders', 'User', 'settings.json'), type: 'global' },
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code - Insiders', 'User', 'mcp.json'), type: 'global' }
    ],
    cline: [
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code - Insiders', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'), type: 'global' }
    ],
    windsurf: [
      { filePath: path.join('.codeium', 'windsurf', 'mcp_config.json'), type: 'local' },
    ],
    roo: [
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
      { filePath: path.join(homeDir, 'Library', 'Application Support', 'Code - Insiders', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'), type: 'global' },
    ],
    'intellij-github-copilot': [
      { filePath: path.join(homeDir, '.config', 'github-copilot', 'intellij', 'mcp.json'), type: 'global' },
    ],
    junie: [
      { filePath: path.join(homeDir, '.junie', 'mcp', 'mcp.json'), type: 'global' },
      { filePath: path.join('.junie', 'mcp', 'mcp.json'), type: 'local' }
    ],

    zed: [
      { filePath: path.join(homeDir, '.config', 'zed', 'settings.json'), type: 'global' },
      { filePath: path.join('.zed', 'settings.json'), type: 'local' }
    ],
    gemini: [
      { filePath: path.join(homeDir, '.gemini', 'settings.json'), type: 'global' },
      { filePath: path.join('.gemini', 'settings.json'), type: 'local' }
    ]
  }
}
