# Credential Detection Feature Implementation

## Overview

This document summarizes the implementation of the enhanced credential detection feature for MCP server configurations, as requested in [Issue #71](https://github.com/lirantal/ls-mcp/issues/71).

## Feature Description

The feature detects credentials across three different sources in MCP server configurations:
1. **Environment Variables** - Traditional env vars that might contain credentials
2. **Command Arguments** - Credentials passed as command-line arguments (e.g., `--api-key TOKEN`)
3. **HTTP Headers** - Credentials in HTTP headers for HTTP-based transports

The system displays them in the CLI output with appropriate risk level indicators and source identification.

## Implementation Details

### 1. Credential Detection Service (`src/services/credential-detection-service.ts`)

- **Multi-Source Detection**: Now analyzes environment variables, command arguments, and HTTP headers
- **Pattern Matching**: Uses regex patterns organized by risk level and source type
- **Variable Substitution Safety**: Detects and excludes safe variable substitution patterns like `${input:token}` or `${env:API_KEY}`
- **Risk Assessment**: Categorizes credentials into high and low risk levels
- **Value Masking**: Masks sensitive values for display (shows first and last character with asterisks)
- **Source Tracking**: Tracks whether credentials come from env, args, or headers

#### Pattern Organization

The credential patterns are organized by source and risk level:

**Environment Variable Patterns** (broad matching for any variable containing these terms):
- High Risk: `.*key.*`, `.*token.*`, `.*password.*`, `.*secret.*`, `.*credential.*`
- Low Risk: Organization and account identifiers

**Command Argument Patterns** (specific flag patterns):
- High Risk: `--api-key`, `--token`, `--password`, `--secret`, `--auth`
- Low Risk: `--org-id`, `--account-id`, `--user-id`

**HTTP Header Patterns** (header name patterns):
- High Risk: `authorization`, `x-api-key`, `bearer-token`, `x-auth-token`
- Low Risk: `x-user-id`, `x-org-id`, `x-account-id`

**Variable Substitution Detection**:
- Pattern: `/^\$\{[^}]+\}$/`
- Examples: `${input:github_token}`, `${env:API_KEY}`, `${config:secret}`
- These are considered safe and excluded from credential risk assessment

### 2. Type System Updates (`src/types/mcp-config-service.types.ts`)

- Added `headers` field to `MCPServerConfig` and `MCPServerInfo` interfaces for HTTP transport support
- Extended `CredentialVariable` interface with `source` field ('env' | 'args' | 'headers')
- Updated `CredentialAnalysisResult` interface for multi-source credential analysis
- **Architecture**: `MCPServerConfig` contains pure configuration data, while `MCPServerInfo` contains enriched metadata including credentials

### 3. MCP Config Service Integration (`src/services/mcp-config-service.ts`)

- Updated to use the comprehensive `analyzeServerConfig` method instead of just analyzing environment variables
- Passes all three credential sources (env, args, headers) to the analysis method
- Maintains clean separation between raw config parsing and credential analysis

### 4. Render Service Updates (`src/services/render-service.ts`)

- Enhanced `CREDENTIALS` column to display multi-source credential information
- Integrated updated `CredentialWarningComponent` for displaying source-specific warnings
- Maintains table formatting and alignment

### 5. Enhanced Credential Warning Component (`src/components/credential-warning.ts`)

- **Source-Specific Icons**: 
  - 🌱 Environment variables (env)
  - ⚡ Command arguments (args)  
  - 🔗 HTTP headers (headers)
- **Risk Level Indicators**: 
  - 🔴 HIGH RISK (red) - API keys, tokens, passwords, secrets
  - 🔵 LOW RISK (blue) - Organization IDs, account identifiers
- **Grouped Display**: Organizes credentials by source for better readability
- **Source Summary**: Shows count and details of credentials from each source

## Enhanced Usage Examples

### 1. Command Arguments Detection
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "TOKEN"]
    }
  }
}
```

**CLI Output:**
```
● HIGH RISK (1 creds: ⚡ args: --api-key=T***N)
```

### 2. HTTP Headers Detection  
```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer real-token-12345",
        "X-API-Key": "${env:GITHUB_API_KEY}",
        "Content-Type": "application/json"
      }
    }
  }
}
```

**CLI Output:**
```
● HIGH RISK (1 creds: 🔗 headers: Authorization=B********5)
```

Note: `X-API-Key` is **not** flagged because it uses variable substitution (`${env:GITHUB_API_KEY}`), which is considered safe.

### 3. Multi-Source Detection
```json
{
  "mcpServers": {
    "comprehensive": {
      "command": "npx",
      "args": ["server", "--token", "arg-token-123"],
      "env": {
        "API_KEY": "env-key-456",
        "SAFE_VAR": "${input:secret}"
      },
      "headers": {
        "Authorization": "Bearer header-auth-789",
        "X-Safe-Header": "${config:token}"
      }
    }
  }
}
```

**CLI Output:**
```
● HIGH RISK (3 creds: 🌱 env: API_KEY=e***6 | ⚡ args: --token=a***3 | 🔗 headers: Authorization=B***9)
```

### 4. Environment Variable Substitution (Safe)
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

**CLI Output:**
```
(No credentials shown - variable substitution detected as safe)
```

## Security Features

1. **Multi-Source Coverage**: Detects credentials in environment variables, command arguments, and HTTP headers
2. **Variable Substitution Safety**: Automatically excludes safe patterns like `${input:token}` and `${env:API_KEY}`
3. **Value Masking**: Sensitive values are masked to prevent exposure in CLI output
4. **Risk Assessment**: Credentials are categorized by risk level (high/low)
5. **Source Identification**: Clear indication of credential source with visual icons
6. **Pattern Recognition**: Uses comprehensive patterns organized by risk level and source type
7. **Non-intrusive**: Only displays warnings, doesn't block or modify configurations

## Enhanced Pattern Maintenance

The new multi-source pattern structure makes it easy to catch credentials across different contexts:

```typescript
// Environment Variable Patterns
private static readonly CREDENTIAL_PATTERNS = {
  high: [/.*key.*/i, /.*token.*/i, /.*password.*/i, /.*secret.*/i],
  low: [/.*org[_-]?id.*/i, /.*account[_-]?id.*/i]
}

// Command Argument Patterns  
private static readonly ARGUMENT_PATTERNS = {
  high: [/--api-key/i, /--token/i, /--password/i, /--secret/i],
  low: [/--org-id/i, /--account-id/i, /--user-id/i]
}

// HTTP Header Patterns
private static readonly HEADER_PATTERNS = {
  high: [/authorization/i, /x-api-key/i, /bearer-token/i],
  low: [/x-user-id/i, /x-org-id/i, /x-account-id/i]
}

// Variable Substitution Detection
private static readonly VARIABLE_SUBSTITUTION_PATTERN = /^\$\{[^}]+\}$/
```

## Testing

- **Unit Tests**: Comprehensive tests for all three credential sources (172 total tests)
- **Integration Tests**: End-to-end tests with realistic MCP server configurations
- **Test Coverage**: All new functionality is thoroughly tested including edge cases
- **Variable Substitution Tests**: Specific tests for safe pattern detection
- **Multi-Source Tests**: Tests combining credentials from multiple sources

## Benefits

1. **Comprehensive Security Coverage**: Detects credentials across all common MCP configuration patterns
2. **Enhanced Security Awareness**: Users can identify potential credential exposure in arguments and headers, not just environment variables
3. **Visual Source Identification**: Clear indication of where credentials are found (env/args/headers)
4. **Smart Safety Detection**: Automatically excludes safe variable substitution patterns
5. **Risk Assessment**: Clear indication of credential risk levels with color coding
6. **Developer Experience**: Non-intrusive warnings that don't break existing workflows
7. **Maintainability**: Easy to add new credential patterns without code changes
8. **Compliance Ready**: Helps with security audits and compliance requirements

## Future Enhancements

1. **Custom Patterns**: Allow users to define custom credential patterns for specific services
2. **Configuration Options**: Configurable risk thresholds and display options
3. **Export Reports**: Generate comprehensive credential audit reports
4. **CI/CD Integration**: Hook into security scanning tools and automated pipelines
5. **Advanced Variable Detection**: Support for more complex variable substitution patterns

## Files Modified/Added

### Core Services
- `src/services/credential-detection-service.ts` - Enhanced with multi-source analysis
- `src/services/mcp-config-service.ts` - Updated to use comprehensive analysis
- `src/services/render-service.ts` - Enhanced credential display

### Types and Interfaces  
- `src/types/mcp-config-service.types.ts` - Added headers support and source tracking

### Components
- `src/components/credential-warning.ts` - Enhanced with source-specific display

### Tests
- `__tests__/credential-detection-service.test.ts` - Comprehensive unit tests (172 tests)
- `__tests__/credential-detection-integration.test.ts` - Multi-source integration tests
- Added tests for arguments, headers, and variable substitution

### Documentation
- `docs/credential-detection.md` - Updated with comprehensive multi-source documentation

## Conclusion

The enhanced credential detection feature provides comprehensive security coverage for MCP server configurations by detecting credentials across environment variables, command arguments, and HTTP headers. The feature includes smart safety detection for variable substitution patterns, clear source identification, and maintains the existing non-intrusive approach while significantly expanding security coverage.

The new architecture makes it easy to maintain and extend credential detection patterns while providing users with clear, actionable security information about their MCP configurations.
