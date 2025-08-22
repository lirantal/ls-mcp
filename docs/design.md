# Project Design

## Overview

The `ls-mcp` project is designed as a modular, service-oriented architecture for discovering and analyzing Model Context Protocol (MCP) server configurations. The design emphasizes separation of concerns, testability, and future extensibility.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│      CLI        │    │    Main.ts       │    │   Services      │
│   (bin/cli.ts)  │───▶│  (MCPFiles)      │───▶│   Layer        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  MCPConfigService│    │  MCPPathRegistry│
                       │                  │    │                 │
                       │  ┌─────────────┐ │    │  ┌─────────────┐ │
                       │  │MCPConfig    │ │    │  │OS Path      │ │
                       │  │Parser       │ │    │  │Resolution   │ │
                       │  └─────────────┘ │    │  └─────────────┘ │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │MCPServerManager │    │  RenderService  │
                       │Service          │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## CLI Design (`bin/cli.ts`)

### Purpose
The CLI serves as the entry point for users to interact with the MCP discovery system. It provides a simple command-line interface for discovering and reporting MCP server configurations.

### Design Principles
- **Single Responsibility**: Only handles command-line argument parsing and output formatting
- **Minimal Logic**: Delegates all business logic to the main application layer
- **User-Friendly**: Provides clear error messages and helpful output

### Flow
1. **Parse Arguments**: Handle command-line options and flags
2. **Initialize Services**: Create the main MCPFiles instance
3. **Execute Discovery**: Call the discovery methods
4. **Format Output**: Use RenderService to format results
5. **Handle Errors**: Provide meaningful error messages and exit codes

### Example Usage
```bash
# Basic discovery
ls-mcp

# Verbose output
ls-mcp --verbose

# JSON output
ls-mcp --json

# Filter by application
ls-mcp --app claude
```

## Main Application (`src/main.ts`)

### Purpose
The main application file serves as the orchestrator, coordinating between different services and providing a clean API for the CLI and other consumers.

### MCPFiles Class

#### Responsibilities
- **Service Coordination**: Orchestrates interactions between different services
- **Error Handling**: Provides unified error handling and reporting
- **Data Transformation**: Converts service outputs into the expected format
- **Process Detection**: Integrates with MCPServerManagerService for server status

#### Key Methods

##### `findFiles()`
Discovers and processes all MCP configurations across supported AI applications.

```typescript
async findFiles(): Promise<MCPFileGroupsResultRecord>
```

**Flow:**
1. Get MCP file groups from MCPConfigService
2. For each group, process configuration files
3. Extract server information from each file
4. Detect running processes for each server
5. Update server status (running/stopped)
6. Return structured results

##### `getMCPConfigService()`
Provides access to the underlying MCPConfigService for advanced usage.

```typescript
getMCPConfigService(): MCPConfigService
```

#### Design Patterns
- **Facade Pattern**: Simplifies complex service interactions
- **Dependency Injection**: Services are injected and can be mocked for testing
- **Error Aggregation**: Collects errors from multiple services and provides unified reporting

## Service Layer Architecture

### 1. MCPConfigService

#### Purpose
Central orchestrator for MCP configuration operations, providing a unified interface for configuration discovery and parsing.

#### Key Responsibilities
- **Path Resolution**: Coordinates with MCPPathRegistry for OS-specific paths
- **File Parsing**: Coordinates with MCPConfigParser for configuration parsing
- **Data Aggregation**: Combines results from multiple sources
- **Error Handling**: Provides meaningful error messages for different failure scenarios

#### Public API
```typescript
class MCPConfigService {
  getConfigFilesPerApp(appName: string): MCPFilePath[]
  getAllConfigFiles(): MCPAppPathsRecord
  getMCPServersPerApp(appName: string): Promise<MCPServerInfo[]>
  getAllMCPServers(): Promise<Record<string, MCPServerInfo[]>>
  getSupportedApps(): MCPAppMetadata[]
  getSupportedOperatingSystems(): string[]
  validateConfigFile(filePath: string): Promise<boolean>
  getMCPFileGroups(): Promise<MCPFileGroupsResultRecord>
  registerCustomApp(appName: string, paths: MCPFilePath[]): void
}
```

### 2. MCPPathRegistry

#### Purpose
Handles OS-specific path resolution for MCP configuration files across different AI applications.

#### Design
- **Static Configuration**: OS-specific paths are defined as static constants
- **Platform Detection**: Automatically detects current operating system
- **Extensible**: Supports custom application registration
- **Error Handling**: Provides clear error messages for unsupported OS

#### Supported Operating Systems
- **Windows** (`win32`): Uses Windows-specific paths
- **macOS** (`darwin`): Uses macOS-specific paths
- **Linux**: Currently unsupported (gracefully handled)

### 3. MCPConfigParser

#### Purpose
Handles parsing and validation of MCP configuration files in various formats.

#### Supported Formats
- **JSON**: Standard JSON files
- **JSONC**: JSON with comments (using `jsonc-parser`)
- **Multiple Keys**: Supports various configuration key names

#### Configuration Keys
- `servers`: Standard MCP server configuration
- `mcpServers`: Alternative key name used by some applications
- `context_servers`: Context-specific server configuration
- `mcp.servers`: Nested configuration structure

### 4. MCPServerManagerService

#### Purpose
Manages MCP server process detection and status reporting.

#### Capabilities
- **Process Detection**: Identifies running MCP server processes
- **Status Reporting**: Provides running/stopped status for each server
- **Transport Support**: Maps MCP config `type` field to internal `transport` field for consistent UI display
- **Error Handling**: Gracefully handles process detection failures

### 5. RenderService

#### Purpose
Handles output formatting and display of MCP configuration information.

#### Output Formats
- **Human-Readable**: Formatted tables and summaries
- **JSON**: Structured data output
- **Custom**: Extensible formatting options

## Data Flow

### 1. Configuration Discovery
```
CLI → Main.ts → MCPConfigService → MCPPathRegistry → File System
```

### 2. Configuration Parsing
```
File System → MCPConfigParser → MCPConfigService → Main.ts → CLI
```

### 3. Process Detection
```
Main.ts → MCPServerManagerService → Process List → Status Update
```

### 4. Output Rendering
```
Status Data → RenderService → Formatted Output → CLI Display
```

## Data Model Architecture

### 1. MCP Configuration File Format
Real MCP server configuration files use the `type` field to specify transport:
```json
{
  "mcpServers": {
    "example-server": {
      "command": "npx",
      "args": ["example-mcp-server"],
      "type": "stdio"
    },
    "http-server": {
      "type": "http",
      "url": "https://example.com/mcp"
    },
    "streamable-server": {
      "type": "streamable-http",
      "url": "https://streamable.example.com/mcp"
    }
  }
}
```

**Supported Transport Types:**
- `stdio`: Standard input/output communication
- `sse`: Server-Sent Events communication
- `http`: HTTP-based communication
- `streamable-http`: Synonym for HTTP (treated identically to `http`)

### 2. Internal Data Model
Our application maintains a clean separation between external and internal data:
- **`type`**: Source of truth from MCP config files (stdio, sse, http, streamable-http)
- **`transport`**: Internal field populated from `type` for consistent UI display
- **Mapping**: `type` → `transport` happens at the data layer (MCPConfigService)
- **Special Handling**: `streamable-http` is mapped to `http` since they are synonyms

### 3. Data Flow Consistency
```
MCP Config File (type: "stdio") 
    ↓
MCPConfigParser (extracts type)
    ↓
MCPConfigService (maps type → transport)
    ↓
Internal Data Model (transport: "stdio")
    ↓
UI Components (TRANSPORT column, summary counts)
```

### 4. Benefits of This Architecture
- **Clear Separation**: External config format vs. internal app data
- **Consistent UI**: All transport information comes from one source (`transport`)
- **Maintainable**: Changes to config format only affect the mapping layer
- **Type Safety**: Internal interfaces clearly define expected data structure

## Error Handling Strategy

### 1. Graceful Degradation
- Individual file failures don't stop the entire discovery process
- Unsupported operating systems are handled gracefully
- Missing configuration files are logged but don't cause failures

### 2. Error Classification
- **File System Errors**: File not found, permission denied, etc.
- **Parsing Errors**: Invalid JSON, malformed configuration
- **OS Errors**: Unsupported operating system
- **Process Errors**: Process detection failures

### 3. User Communication
- Clear, actionable error messages
- Appropriate exit codes for different error types
- Verbose logging for debugging via `NODE_DEBUG=ls-mcp` environment variable

## Testing Strategy

### 1. Unit Testing
- Each service is tested in isolation
- Mocked dependencies prevent external system access
- Comprehensive error scenario coverage

### 2. Integration Testing
- Service interactions are tested
- End-to-end workflows are validated
- Real configuration files are used (fixtures)

### 3. Test Isolation
- High-level tests use mocking to prevent filesystem access
- Service tests use fixture files within the project directory
- CI compatibility is maintained across different operating systems

## Future Extensibility

### 1. Service Extraction
- Services are designed to be easily extracted to separate npm packages
- Clear interfaces and minimal dependencies
- Consistent error handling and logging patterns

### 2. Plugin Architecture
- Support for custom AI application definitions
- Extensible configuration file format support
- Custom output formatters and renderers

### 3. Cross-Platform Support
- Linux support can be added by extending MCPPathRegistry
- Additional operating systems can be supported
- Platform-specific optimizations can be implemented

## Performance Considerations

### 1. File System Access
- Minimal file system operations
- Efficient path resolution caching
- Parallel processing where possible

### 2. Memory Management
- Streaming for large configuration files
- Efficient data structures for server information
- Minimal object creation during processing

### 3. Process Detection
- Efficient process list scanning
- Caching of process information
- Timeout handling for slow operations

## Debugging and Logging

### 1. Debug Mode
- Uses Node.js core `util.debuglog` for conditional logging
- Debug namespace: `ls-mcp`
- Enabled via `NODE_DEBUG=ls-mcp` environment variable
- Provides detailed information about file parsing, server detection, and error handling

### 2. Logging Levels
- **Normal mode**: Clean output with essential information only
- **Debug mode**: Verbose logging including file access attempts, parsing results, and error details
- **Error mode**: Always shows critical errors regardless of debug setting

### 3. Debug Output Examples
- File parsing failures and reasons
- Skipped files and access issues
- Server detection results
- Configuration validation outcomes

## Security Considerations

### 1. File Access
- Path traversal prevention
- Permission checking for sensitive files
- Safe handling of user-provided paths

### 2. Process Information
- Secure process detection methods
- Minimal process information exposure
- Safe handling of process metadata

### 3. Configuration Validation
- Input sanitization for configuration files
- Safe parsing of untrusted content
- Validation of server command paths
