# Project Requirements

## Overview

This document outlines the requirements for the `ls-mcp` project, a command-line tool for discovering and analyzing Model Context Protocol (MCP) server configurations across various AI applications and operating systems.

## Core Requirements

### 1. MCP Configuration Discovery

- **Must** discover MCP configuration files across multiple AI applications
- **Must** support both global and local configuration file locations
- **Must** handle multiple configuration file formats (JSON, JSONC)
- **Must** support various MCP server configuration keys:
  - `servers`
  - `mcpServers`
  - `context_servers`
  - `mcp.servers`

### 2. Operating System Support

- **Must** support Windows (`win32`) operating systems
- **Must** support macOS (`darwin`) operating systems
- **Must** gracefully handle unsupported operating systems (e.g., Linux)
- **Future**: Linux support should be added in a future iteration

### 3. AI Application Support

The following AI applications are currently supported:

- **Claude Desktop** (`claude`)
- **VS Code** (`vscode`)
- **Cursor** (`cursor`)
- **Cline** (`cline`)
- **Windsurf** (`windsurf`)
- **Roo** (`roo`)
- **IntelliJ GitHub Copilot** (`intellij-github-copilot`)
- **Junie** (`junie`)
- **Zed** (`zed`)
- **Gemini CLI** (`gemini`)

### 4. Configuration File Parsing

- **Must** parse valid JSON and JSONC files
- **Must** handle malformed JSON gracefully
- **Must** validate MCP server configurations
- **Must** extract server information (name, command, args, transport, type, env)
- **Must** support server transport types: `stdio`, `sse`, `http`

### 5. Process Detection

- **Must** detect running MCP server processes
- **Must** provide server status information (running/stopped)
- **Must** handle process detection errors gracefully

## Testing Requirements

### 1. Unit Testing

- **Must** have 100% test coverage for all service classes
- **Must** test all public methods of each service
- **Must** test error handling and edge cases
- **Must** test OS-specific functionality

#### Current Test Coverage

- ✅ **MCPPathRegistry**: 100% coverage
- ✅ **MCPConfigParser**: 97% coverage
- ✅ **MCPConfigService**: 90.76% coverage
- ✅ **MCPServerManagerService**: 54.3% coverage (needs improvement)
- ✅ **RenderService**: 98.65% coverage

### 2. Integration Testing

- **Must** test service interactions
- **Must** test CLI functionality
- **Must** test end-to-end workflows
- **Must** test with real configuration files (fixtures)

### 3. Test Isolation

- **Must** isolate high-level tests from real filesystem access
- **Must** use proper mocking for external dependencies
- **Must** prevent tests from accessing files outside project directory
- **Must** use fixture files for testing configuration parsing

### 4. CI/CD Testing

- **Must** pass tests on all supported operating systems
- **Must** handle unsupported OS gracefully (e.g., Linux in CI)
- **Must** maintain consistent test results across environments

## Future Testing Requirements

### 1. Linux Support Testing

- **Should** add comprehensive Linux support testing when implemented
- **Should** test Linux-specific path resolution
- **Should** test Linux-specific configuration file locations

### 2. Performance Testing

- **Should** test performance with large configuration files
- **Should** test memory usage with many MCP servers
- **Should** test startup time and response latency

### 3. Security Testing

- **Should** test file permission handling
- **Should** test malicious configuration file handling
- **Should** test path traversal vulnerability prevention

### 4. Cross-Platform Testing

- **Should** test on various Windows versions
- **Should** test on various macOS versions
- **Should** test on different file system types

## What's Not Tested Yet

### 1. MCPServerManagerService

- Process detection edge cases
- Different transport type handling
- Environment variable handling
- URL-based server configurations

### 2. CLI Integration

- Command-line argument parsing
- Output formatting edge cases
- Error reporting to users
- Exit code handling

### 3. Real-World Scenarios

- Large configuration files (>1MB)
- Network-based configuration files
- Symlinked configuration files
- Configuration file corruption scenarios

## Scope Boundaries

### In Scope

- MCP configuration file discovery and parsing
- MCP server configuration validation
- Process detection for running servers
- Cross-platform path resolution
- CLI interface for discovery and reporting
- Service architecture for modularity

### Out of Scope

- MCP server implementation
- MCP protocol communication
- Configuration file editing
- Server management (start/stop/restart)
- Network discovery of MCP servers
- Authentication and authorization
- Configuration file encryption

## Quality Requirements

### 1. Code Quality

- **Must** follow TypeScript best practices
- **Must** use proper error handling
- **Must** provide meaningful error messages
- **Must** use consistent naming conventions
- **Must** include JSDoc comments for public APIs

### 2. Performance

- **Must** complete discovery in under 5 seconds on typical systems
- **Must** handle configuration files up to 10MB
- **Must** support up to 1000 MCP servers per system

### 3. Reliability

- **Must** handle corrupted configuration files gracefully
- **Must** continue operation if individual files fail to parse
- **Must** provide fallback behavior for missing configurations

### 4. Maintainability

- **Must** use service-oriented architecture
- **Must** separate concerns between different services
- **Must** provide clear interfaces between components
- **Must** support future extraction to separate npm packages

## Future Enhancements

### 1. Linux Support

- Add Linux path resolution
- Test Linux-specific configurations
- Validate Linux compatibility

### 2. Additional AI Applications

- Support for new AI tools and IDEs
- Plugin architecture for custom applications
- Community-contributed application definitions

### 3. Advanced Features

- Configuration file validation schemas
- Configuration file templates
- Server health monitoring
- Performance metrics collection

### 4. Developer Experience

- Better error reporting
- Configuration file debugging tools
- Integration with development workflows
- IDE extensions and plugins
