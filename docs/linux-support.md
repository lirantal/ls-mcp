# Linux Support

## Overview

As of version 1.12.0, `ls-mcp` provides comprehensive Linux support for detecting MCP server configurations across various AI applications and editors.

## Linux File Path Conventions

The Linux implementation follows standard XDG Base Directory specifications and common Linux filesystem conventions:

### Global Configuration Paths
- **XDG Config Directory**: `~/.config/` (primary location for application configs)
- **Home Directory**: `~/` (for simple dotfiles and legacy applications)

### Local Configuration Paths
- **Project Root**: Configuration files in the current project directory
- **Hidden Directories**: App-specific hidden directories (e.g., `.vscode/`, `.cursor/`)

## Supported Applications on Linux

| Application | Global Path | Local Path |
|-------------|-------------|------------|
| **Claude Desktop** | `~/.config/Claude/claude_desktop_config.json` | N/A |
| **VS Code** | `~/.config/Code/User/mcp.json`<br>`~/.config/Code/User/settings.json`<br>`~/.mcp.json` | `.vscode/mcp.json` |
| **VS Code Insiders** | `~/.config/Code - Insiders/User/mcp.json`<br>`~/.config/Code - Insiders/User/settings.json` | `.vscode/mcp.json` |
| **Cursor** | `~/.cursor/mcp.json` | `.cursor/mcp.json` |
| **Cline** | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | N/A |
| **Roo** | `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json` | N/A |
| **Windsurf** | N/A | `.codeium/windsurf/mcp_config.json` |
| **IntelliJ GitHub Copilot** | `~/.config/github-copilot/intellij/mcp.json` | N/A |
| **Junie** | `~/.junie/mcp.json` | `.junie/mcp/mcp.json` |
| **Zed** | `~/.config/zed/settings.json` | `.zed/settings.json` |
| **Gemini CLI** | `~/.gemini/settings.json` | `.gemini/settings.json` |

## Directory Bubbling on Linux

The directory bubbling feature works seamlessly on Linux, automatically searching parent directories for local MCP configuration files. This is particularly useful when working in nested project structures.

### Search Boundaries
- **Home Directory**: Stops at `$HOME` (typically `/home/username`)
- **Root Directory**: Stops at `/` as the ultimate boundary
- **Symlink Handling**: Follows symlinks during traversal

## Environment Variables

The Linux implementation respects standard Linux environment variables:

- `$HOME` - User's home directory (fallback: `/`)
- `$XDG_CONFIG_HOME` - XDG config directory (future enhancement)

## Installation and Usage

Linux users can use `ls-mcp` just like on other platforms:

```bash
# Install globally
npm install -g ls-mcp

# Run from any directory
ls-mcp

# Run with npx (no installation)
npx ls-mcp
```

## Testing

All Linux paths and functionality are covered by comprehensive tests, ensuring reliable operation across different Linux distributions and configurations.

## Future Enhancements

- **XDG Base Directory Support**: Full support for `$XDG_CONFIG_HOME` and other XDG variables
- **Flatpak Support**: Detection of Flatpak-installed applications with custom config paths
- **Snap Support**: Support for Snap package configuration locations
- **AppImage Support**: Detection of AppImage-based applications
