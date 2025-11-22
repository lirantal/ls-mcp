# Custom File Analysis with --files Flag

## Overview

The `--files` flag allows you to analyze specific MCP configuration files instead of relying on automatic discovery of configuration files from known AI applications and IDEs. When you use the `--files` flag, automatic discovery is completely bypassed, and only the files you specify are analyzed.

## Usage

### Basic Syntax

```bash
npx ls-mcp --files <file-path> [additional-files...]
```

### Single File

Analyze a single MCP configuration file:

```bash
npx ls-mcp --files ./my-mcp-config.json
```

### Multiple Files

You can specify multiple files using either comma-separated or space-separated syntax:

#### Comma-Separated

```bash
npx ls-mcp --files ./config1.json,./config2.json,./config3.json
```

#### Space-Separated

```bash
npx ls-mcp --files ./config1.json ./config2.json ./config3.json
```

### Combining with Other Flags

The `--files` flag works seamlessly with other CLI flags:

```bash
# JSON output
npx ls-mcp --files ./config.json --json

# Debug mode with custom files
NODE_DEBUG=ls-mcp npx ls-mcp --files ./config.json
```

## Supported Configuration Formats

The `--files` flag automatically detects the configuration structure in your files. It supports multiple configuration key formats:

### Standard Format: `servers`

```json
{
  "servers": {
    "my-server": {
      "command": "node",
      "args": ["./server.js"],
      "type": "stdio"
    }
  }
}
```

### Alternative Format: `mcpServers`

```json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["-m", "mcp_server"],
      "type": "stdio"
    }
  }
}
```

### Nested Format: `mcp.servers`

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-example"],
        "type": "stdio"
      }
    }
  }
}
```

### Context Format: `context_servers`

```json
{
  "context_servers": {
    "my-server": {
      "url": "https://api.example.com/mcp",
      "type": "sse"
    }
  }
}
```

## Features

When analyzing custom files with the `--files` flag, you get the same comprehensive analysis as with automatic discovery:

- ✅ **Configuration Validation**: Checks if files are parsable and valid
- ✅ **Server Detection**: Identifies all MCP servers in the configuration
- ✅ **Status Monitoring**: Detects if servers are currently running
- ✅ **Security Analysis**: Scans for exposed credentials in environment variables, arguments, and headers
- ✅ **Version Detection**: Identifies pinned vs. implicit latest versions for npm packages
- ✅ **Transport Analysis**: Categorizes servers by transport type (stdio, SSE, HTTP)
- ✅ **URL Hostname Extraction**: Displays clean hostnames for URL-based servers

## Output Examples

### Console Output

```bash
$ npx ls-mcp --files ./custom-config.json

[+] Analyzing specified MCP configuration files...

[1]   PROVIDER     Custom Files
      FILE         /path/to/custom-config.json
      TYPE         LOCAL
      PARSABLE     ●
      MCP SERVERS  ░░░░░░░░░░░░░░░░░░░░ 0 / 2 Running

      ────────────────────────────────────────────────────────────
      STATUS  NAME         VERSION    SOURCE  TRANSPORT  CREDENTIALS
      ────────────────────────────────────────────────────────────
        ●     my-server    ● LATEST     npx     STDIO
        ●     api-server             example.com  SSE

      ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

      SUMMARY
            SERVERS     ░░░░░░░░░░░░░░░░░░░░ 0 / 2 Running
            SECURITY    ░░░░░░░░░░░░░░░░░░░░ 0 / 2 High Risk Credentials
            VERSION     ██████████░░░░░░░░░░ 1 / 2 Implicit Latest
            TRANSPORT   stdio: 1 | SSE: 1 | HTTP: 0

      ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
```

### JSON Output

```bash
$ npx ls-mcp --files ./custom-config.json --json
```

```json
{
  "mcpFiles": {
    "custom": {
      "name": "custom",
      "friendlyName": "Custom Files",
      "paths": [
        {
          "filePath": "/path/to/custom-config.json",
          "type": "local",
          "parsable": true,
          "servers": [
            {
              "name": "my-server",
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-example"],
              "transport": "stdio",
              "type": "stdio",
              "source": "npx",
              "status": "stopped",
              "versionInfo": {
                "packageName": "@modelcontextprotocol/server-example",
                "isPinned": false,
                "isLatest": true
              },
              "credentials": {
                "hasCredentials": false,
                "credentialVars": [],
                "riskLevel": "none"
              }
            }
          ]
        }
      ],
      "stats": {
        "serversCount": 1
      }
    }
  },
  "summary": {
    "totalServers": 1,
    "runningServers": 0,
    "highRiskCredentials": 0,
    "implicitLatestVersions": 1,
    "transportBreakdown": {
      "stdio": 1,
      "sse": 0,
      "http": 0
    }
  }
}
```

## Error Handling

The tool handles various error scenarios gracefully:

### Non-Existent Files

If a specified file doesn't exist, it will be marked as non-parsable but won't stop the analysis:

```bash
$ npx ls-mcp --files ./non-existent.json

[1]   PROVIDER     Custom Files
      FILE         /path/to/non-existent.json
      TYPE         LOCAL
      PARSABLE     ●  # Red circle indicates non-parsable
      MCP SERVERS  ░░░░░░░░░░░░░░░░░░░░ 0 / 0 Running
```

### Invalid JSON

Files with invalid JSON syntax are marked as non-parsable:

```bash
$ npx ls-mcp --files ./invalid.json

[1]   PROVIDER     Custom Files
      FILE         /path/to/invalid.json
      TYPE         LOCAL
      PARSABLE     ●  # Red circle indicates syntax error
      MCP SERVERS  ░░░░░░░░░░░░░░░░░░░░ 0 / 0 Running
```

## Use Cases

### Testing Custom Configurations

Test MCP configurations before deploying them to your AI tools:

```bash
npx ls-mcp --files ./test-config.json
```

### Auditing Multiple Projects

Analyze MCP configurations across multiple projects:

```bash
npx ls-mcp --files \
  ./project-a/mcp.json \
  ./project-b/config.json \
  ./project-c/servers.json
```

### CI/CD Integration

Use in CI/CD pipelines to validate MCP configurations:

```bash
# Validate and get JSON output
npx ls-mcp --files ./config.json --json > mcp-analysis.json

# Check for high-risk credentials
if npx ls-mcp --files ./config.json --json | jq -e '.summary.highRiskCredentials > 0'; then
  echo "⚠️  High-risk credentials detected!"
  exit 1
fi
```

### Security Scanning

Scan configuration files for security issues:

```bash
# Scan all JSON files in a directory
for file in configs/*.json; do
  echo "Scanning $file..."
  npx ls-mcp --files "$file"
done
```

## Behavior Differences

### With `--files` Flag

- ✅ Analyzes only the specified files
- ✅ No automatic discovery of configurations from AI applications
- ✅ Files are grouped under "Custom Files" provider
- ✅ All file paths are resolved to absolute paths
- ✅ Supports both relative and absolute file paths
- ✅ Home directory expansion (`~`) is supported
- ✅ **Always shows the "Custom Files" group**, even if it contains zero servers (since you explicitly requested to analyze those files)

### Without `--files` Flag (Default)

- ✅ Automatically discovers configurations from known AI applications
- ✅ Scans multiple providers (Claude, Cursor, VS Code, Cline, etc.)
- ✅ Groups files by application/provider
- ✅ Supports directory bubbling for local configurations
- ✅ **Hides providers with zero configured servers by default** (use `--all` or `-a` to show them)

### Zero Servers Handling

By default, `ls-mcp` optimizes output by hiding provider groups that have zero configured servers:

```bash
# Default behavior: hides empty providers
npx ls-mcp

# Show all providers including those with zero servers
npx ls-mcp --all

# Short form
npx ls-mcp -a
```

**Important**: When using `--files`, the "Custom Files" group is always shown regardless of server count, since you explicitly requested to analyze specific files. This allows you to verify that your configuration files were processed correctly, even if they contain zero servers.

## Technical Details

### Path Resolution

All file paths are resolved to absolute paths:
- Relative paths are resolved from the current working directory
- Home directory expansion (`~`) is supported
- Both forward slashes and backslashes work on all platforms

### Configuration Detection

The tool uses the `MCPConfigParser` from the `agent-files` package, which:
- Automatically detects configuration structure
- Supports multiple configuration key formats
- Validates JSON syntax
- Extracts server configurations regardless of the key name used

### Performance

- Files are processed sequentially
- Invalid files don't block processing of subsequent files
- Processing is fast even with multiple files
- No network requests are made during file parsing

## Related Documentation

- [Project Overview](./project.md) - Comprehensive project architecture
- [Design Documentation](./design.md) - Technical implementation details
- [Credential Detection](./credential-detection.md) - Security analysis features
- [Directory Bubbling](./directory-bubbling.md) - Automatic discovery features

## Examples

See the test configuration files for working examples:
- `__tests__/test-configs/custom-mcpservers.json` - Example using `mcpServers` key
- `__tests__/test-configs/custom-servers.json` - Example using `servers` key
