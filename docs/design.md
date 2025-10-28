# Project Design

## Overview

The `ls-mcp` project is designed as a modular, service-oriented architecture for discovering and analyzing Model Context Protocol (MCP) server configurations. The design emphasizes separation of concerns, testability, and future extensibility.

## Architecture Overview

The project is composed of the main `ls-mcp` application and a new, separate package called `agent-files`.

*   **`ls-mcp`**: The main application that provides the CLI, orchestrates the discovery process, and handles features like process detection and output rendering.
*   **`agent-files`**: A dedicated package that contains the logic for discovering, parsing, and handling MCP configuration file paths.

The `ls-mcp` application depends on the `agent-files` package to handle the low-level details of file discovery and parsing.

## Directory Bubbling Service

### Purpose
The DirectoryBubbleService provides intelligent directory traversal capabilities to enhance the discovery of local MCP configuration files. It automatically searches parent directories when local configs are not found in the current directory, improving Developer Experience. This service is part of the `agent-files` package.

### Design Principles
- **Intelligent Traversal**: Automatically bubbles up directory tree until finding config files or reaching boundaries
- **Boundary Safety**: Stops at home directory (`~`) or root directory (`/`) to prevent infinite loops
- **Performance Optimized**: Stops at first encounter of matching config file (closest to current directory)
- **Error Resilient**: Silently handles permission errors, non-existent directories, and other filesystem issues
- **Symlink Aware**: Follows symlinks during traversal for comprehensive coverage

### Key Methods

#### `findLocalConfigInParentDirectories(localPath, startDir)`
Searches for a local MCP configuration file by traversing up the directory tree.

```typescript
async findLocalConfigInParentDirectories(
  localPath: string,
  startDir: string
): Promise<string | null>
```

**Flow:**
1. Check if config file exists in start directory
2. If not found, traverse up to parent directory
3. Continue until config file is found or boundaries are reached
4. Return absolute path to found config file or null

#### `checkDirectoryForConfig(dir, configPath)`
Checks if a specific configuration file exists in a given directory.

#### `getParentDirectory(dir)`
Safely gets the parent directory path, handling edge cases like root directory.

### Integration with MCPConfigService
- **Optional Feature**: Directory bubbling is controlled by constructor options in `MCPConfigService`.
- **Local Paths Only**: Only applies to paths marked as `'local'` type.
- **Seamless Integration**: Works transparently with existing configuration discovery logic.

### Example Usage
```typescript
const bubbleService = new DirectoryBubbleService()

// Find .vscode/mcp.json starting from nested directory
const configPath = await bubbleService.findLocalConfigInParentDirectories(
  '.vscode/mcp.json',
  '/projects/my-project/backend/services'
)
// Returns: '/projects/my-project/.vscode/mcp.json'
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
- **Service Coordination**: Orchestrates interactions between different services.
- **Error Handling**: Provides unified error handling and reporting.
- **Data Transformation**: Converts service outputs into the expected format.
- **Process Detection**: Integrates with MCPServerManagerService for server status.

#### Key Methods

##### `findFiles()`
Discovers and processes all MCP configurations across supported AI applications.

```typescript
async findFiles(): Promise<MCPFileGroupsResultRecord>
```

**Flow:**
1. Get MCP file groups from `MCPConfigService`.
2. For each group, process configuration files.
3. Extract server information from each file.
4. Detect running processes for each server.
5. Update server status (running/stopped).
6. Return structured results.

##### `getMCPConfigService()`
Provides access to the underlying `MCPConfigService` for advanced usage.

```typescript
getMCPConfigService(): MCPConfigService
```

#### Design Patterns
- **Facade Pattern**: Simplifies complex service interactions.
- **Dependency Injection**: Services are injected and can be mocked for testing.
- **Error Aggregation**: Collects errors from multiple services and provides unified reporting.

## Service Layer Architecture

### 1. MCPConfigService

#### Purpose
Central orchestrator for MCP configuration operations, providing a unified interface for configuration discovery and parsing. It consumes the `agent-files` package for low-level file operations.

#### Key Responsibilities
- **Path Resolution**: Coordinates with `MCPPathRegistry` (from `agent-files`) for OS-specific paths.
- **File Parsing**: Coordinates with `MCPConfigParser` (from `agent-files`) for configuration parsing.
- **Data Aggregation**: Combines results from multiple sources.
- **Error Handling**: Provides meaningful error messages for different failure scenarios.
- **Directory Bubbling**: Uses the `DirectoryBubbleService` (from `agent-files`) to intelligently traverse parent directories.

### 2. `agent-files` Package

This package contains the core logic for file discovery and parsing.

#### MCPPathRegistry
- **Purpose**: Handles OS-specific path resolution for MCP configuration files across different AI applications.
- **Design**: Static configuration for paths, platform detection, and support for custom app registration.

#### MCPConfigParser
- **Purpose**: Handles parsing and validation of MCP configuration files in various formats (JSON, JSONC).
- **Features**: Supports multiple configuration key names (`servers`, `mcpServers`, etc.).

#### DirectoryBubbleService
- **Purpose**: Handles intelligent directory traversal to find local MCP config files in parent directories.

### 3. MCPServerManagerService

#### Purpose
Manages MCP server process detection and status reporting.

#### Capabilities
- **Process Detection**: Identifies running MCP server processes.
- **Status Reporting**: Provides running/stopped status for each server.
- **Transport Support**: Maps MCP config `type` field to internal `transport` field for consistent UI display.
- **Error Handling**: Gracefully handles process detection failures.

### 4. RenderService

#### Purpose
Handles output formatting and display of MCP configuration information.

#### Output Formats
- **Human-Readable**: Formatted tables and summaries.
- **JSON**: Structured data output.
- **Custom**: Extensible formatting options.

## Data Flow

### 1. Configuration Discovery
```
CLI → Main.ts → MCPConfigService → agent-files (MCPPathRegistry) → File System
```

### 2. Configuration Parsing
```
File System → agent-files (MCPConfigParser) → MCPConfigService → Main.ts → CLI
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

## Transport Inference

### 1. Automatic Transport Detection
When MCP server configurations don't explicitly specify a `type` field, the system automatically infers transport types using intelligent pattern matching:

**Rule 1: URL-based Inference**
```json
{
  "servers": {
    "web-server": {
      "url": "https://example.com/mcp"
      // No type field → automatically inferred as "http"
      // Hostname "example.com" will be displayed in SOURCE column
    }
  }
}
```

**Rule 2-4: Args-based Inference**
```json
{
  "servers": {
    "stdio-server": {
      "command": "npx",
      "args": ["-y", "stdio-mcp-server", "--stdio"]
      // No type field → automatically inferred as "stdio" from --stdio flag
    },
    "http-server": {
      "command": "npx", 
      "args": ["-y", "http-mcp-server", "--http", "--port", "3000"]
      // No type field → automatically inferred as "http" from --http flag
    },
    "sse-server": {
      "command": "npx",
      "args": ["-y", "sse-mcp-server", "--sse", "--endpoint", "/mcp"]
      // No type field → automatically inferred as "sse" from --sse flag
    }
  }
}
```

**Rule 5: Default Inference**
```json
{
  "servers": {
    "generic-server": {
      "command": "npx",
      "args": ["-y", "generic-mcp-server"]
      // No type field, no transport indicators → defaults to "stdio"
    }
  }
}
```

### 2. Inference Priority
1. **Explicit Type**: `"type": "stdio"` (highest priority)
2. **URL Detection**: Presence of `url` field → `http`
3. **Args Analysis**: Keywords in `args` array → corresponding transport
4. **Default Fallback**: `command` present → `stdio` (most common case)

### 3. Benefits of Transport Inference
- **Better User Experience**: Transport types visible even when configs don't specify them
- **Improved Accuracy**: More accurate transport counts in CLI summary
- **Backward Compatibility**: Works with existing MCP server configurations
- **Intelligent Defaults**: Reasonable assumptions based on configuration patterns
- **Comprehensive Coverage**: Handles all common MCP server configuration scenarios

## URL Hostname Extraction

### Overview
The URL hostname extraction feature (Feature #80) improves the readability of MCP server configurations by displaying only the hostname portion for URL-based servers in the SOURCE column.

### Implementation Details

#### 1. Hostname Extraction Logic
```typescript
export function extractHostname(urlString: string): string {
  try {
    // Handle URLs without protocol by adding a default one
    let urlToParse = urlString
    if (!urlToParse.includes('://')) {
      urlToParse = `http://${urlToParse}`
    }
    const url = new URL(urlToParse)
    return url.hostname
  } catch (error) {
    // If URL parsing fails, return the original string
    return urlString
  }
}
```

#### 2. Service Integration
- **MCPConfigService**: Extracts hostname during server configuration conversion
- **MCPServerManagerService**: Sets source field to hostname when URL is available
- **Fallback Handling**: Returns original string if URL parsing fails

#### 3. URL Format Support
- **HTTP/HTTPS**: Standard web protocols
- **Custom Protocols**: Any protocol supported by Node.js URL constructor
- **Protocol-less URLs**: Automatically adds `http://` for parsing
- **IP Addresses**: Handles both IPv4 and IPv6 addresses
- **Port Numbers**: Port information is stripped from display
- **Query Parameters**: Query strings are ignored in hostname extraction

#### 4. Benefits
- **Cleaner Output**: SOURCE column is more readable and concise
- **Better UX**: Users can quickly identify server location without URL clutter
- **Consistent Display**: All URL-based servers show consistent hostname format
- **Robust Parsing**: Handles various URL formats gracefully with fallback

#### 5. Example Transformations
```
Before: "http://localhost:3000/mcp" → After: "localhost"
Before: "https://api.example.com/v1/mcp" → After: "api.example.com"
Before: "192.168.1.100:8080" → After: "192.168.1.100"
Before: "invalid-url" → After: "invalid-url" (fallback)
```

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
