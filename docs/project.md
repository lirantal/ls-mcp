# Project Analysis: ls-mcp

## Purpose

`ls-mcp` is a command-line tool for detecting and listing MCP (Model Context Protocol) servers in a local development environment. It helps developers quickly see which MCP servers are configured on their system and whether they are currently running.

## How it Works

The tool works by scanning for known MCP configuration files associated with various code editors and tools. Here's a high-level overview of the process:

1.  **File Discovery:** The tool starts by looking for MCP configuration files in predefined locations. These locations are specific to different applications (like VS Code, Claude, Cursor, etc.) and operating systems (macOS, Windows). The tool gracefully handles unsupported operating systems (like Linux) by providing meaningful error messages.

   **Directory Bubbling Feature:** For local (project-scoped) MCP configuration files, the tool now includes an intelligent directory bubbling feature. If a local config file isn't found in the current directory, it automatically searches up the directory tree until it finds the file or reaches the user's home directory or root directory. This provides better Developer Experience (DX) by allowing users to run `ls-mcp` from anywhere within their project structure and still detect project-scoped MCP config files.

2.  **Configuration Parsing:** Once a configuration file is found, it is parsed to extract the list of configured MCP servers. The tool can handle standard JSON and JSON with comments (JSONC). It's designed to be flexible and can find server configurations under different keys like `servers`, `mcp.servers`, `mcpServers`, and `context_servers` to support a variety of applications.

3.  **Process Detection:** For each configured MCP server, the tool checks if it is currently running. It does this by executing system commands (`ps` on macOS and `powershell` on Windows) to get a list of all active processes. It then compares the command from the MCP configuration with the running processes to determine the server's status. The tool includes specific logic to handle common ways of running MCP servers, such as using `uvx` or `npx`.

4.  **Output Rendering:** Finally, all the gathered information is displayed in a formatted table in the console. The table shows the server's status (running or stopped), name, source (the command used to start it), and transport protocol.

## Project Structure

The project is a TypeScript-based Node.js application with a clear, modular, service-oriented architecture:

### Core Application Files
*   `src/main.ts`: Contains the `MCPFiles` class that orchestrates the entire discovery process, coordinating between different services and providing a clean API.
*   `src/bin/cli.ts`: The entry point for the command-line interface. It handles argument parsing and delegates all business logic to the main application layer.

### Service Layer
The project has been refactored into a modular service architecture for better separation of concerns and testability:

*   `src/services/mcp-config-service.ts`: Central orchestrator for MCP configuration operations, providing a unified interface for configuration discovery and parsing. Includes optional directory bubbling functionality for enhanced local config file discovery.
*   `src/services/mcp-path-registry.ts`: Handles OS-specific path resolution for MCP configuration files across different AI applications.
*   `src/services/mcp-config-parser.ts`: Handles parsing and validation of MCP configuration files in various formats (JSON, JSONC).
*   `src/services/mcp-server-manager-service.ts`: Manages MCP server process detection and status reporting.
*   `src/services/render-service.ts`: Handles output formatting and display of MCP configuration information.
*   `src/services/mcp-config-linter-service.ts`: Legacy service that now delegates to the new MCPConfigParser for backward compatibility.
*   `src/services/directory-bubble-service.ts`: Handles intelligent directory traversal to find local MCP config files in parent directories, improving Developer Experience when running from nested project subdirectories.

### Type Definitions
*   `src/types/mcp-config-service.types.ts`: Comprehensive type definitions for all MCP configuration services, designed for future extraction to separate npm packages.

### Data Model Architecture
The project maintains a clean separation between external MCP configuration files and internal application data:

*   **External Config Format**: MCP config files use `type` field for transport specification (e.g., `"type": "stdio"`, `"type": "http"`, `"type": "streamable-http"`)
*   **Internal Data Model**: Our application maps `type` to `transport` field for consistent UI display and internal logic
*   **Clean Mapping**: The `MCPConfigService` handles the one-way mapping from `type` → `transport` at the data layer
*   **Special Handling**: `streamable-http` is treated as synonym for `http` and mapped accordingly
*   **UI Consistency**: All transport information in the UI (TRANSPORT column, summary counts) comes from the internal `transport` field
*   **Transport Inference**: When no explicit `type` field is present, the system automatically infers transport types using intelligent pattern matching:
    - **URL Detection**: Presence of `url` field → `http` transport
    - **Args Analysis**: Keywords in `args` array → corresponding transport (`stdio`, `http`, `sse`)
    - **Default Fallback**: `command` present → `stdio` transport (most common case)

This architecture ensures maintainability and clear separation of concerns between external data formats and internal application logic, while providing intelligent defaults for better user experience.

### Testing
*   `__tests__/`: Comprehensive test suite with proper isolation and mocking to prevent real filesystem access during testing.
*   `__tests__/__fixtures__/`: Test fixture files for isolated testing of configuration parsing.

## Current Status

### ✅ Completed Refactoring
- **Service Architecture**: Successfully separated MCP configuration logic into dedicated, focused services
- **Data Model Architecture**: Implemented clean separation between external MCP config format (`type`) and internal app data (`transport`)
- **Transport Handling**: Fixed transport counting by properly mapping `type` field to `transport` field at the data layer
- **Extended Transport Support**: Added support for `streamable-http` type, treating it as synonym for `http`
- **Transport Inference**: Implemented intelligent automatic detection of transport types when not explicitly specified
- **Directory Bubbling**: Implemented intelligent directory traversal for local MCP config files, providing better DX when running from nested project subdirectories
- **Test Isolation**: Fixed critical issue where tests were accessing real files outside the project directory
- **Type Safety**: Created comprehensive TypeScript types for all services
- **Error Handling**: Improved error handling and graceful degradation for unsupported operating systems
- **CI Compatibility**: Tests now pass in all environments, including Linux CI (with graceful unsupported OS handling)

### 🔧 Current Test Coverage
- **MCPPathRegistry**: 100% coverage
- **MCPConfigParser**: 97% coverage  
- **MCPConfigService**: 90.84% coverage
- **MCPServerManagerService**: 54.3% coverage (needs improvement)
- **RenderService**: 98.65% coverage
- **DirectoryBubbleService**: 95.89% coverage

### 🚀 Ready for Future
- **Package Extraction**: Services are designed to be easily extracted to separate npm packages
- **Linux Support**: Architecture supports adding Linux support in future iterations
- **Plugin System**: Extensible design for custom AI application definitions

## Directory Bubbling Feature

### Overview
The directory bubbling feature enhances the Developer Experience (DX) by automatically detecting MCP configuration files in parent directories when running `ls-mcp` from nested project subdirectories.

### How It Works
1. **Local Path Detection**: When processing local (project-scoped) MCP configuration files, the tool first checks if the file exists in the current directory
2. **Intelligent Traversal**: If not found, it automatically "bubbles up" the directory tree, checking each parent directory for the configuration file
3. **Boundary Safety**: The traversal stops at the user's home directory (`~`) or root directory (`/`) to prevent infinite loops
4. **First Match Wins**: The tool stops at the first encounter of a matching configuration file (closest to the current directory)

### Example Scenarios

#### Scenario 1: Running from Project Root
```bash
cd ~/projects/my-project
ls-mcp  # ✅ Detects .vscode/mcp.json in current directory
```

#### Scenario 2: Running from Nested Directory
```bash
cd ~/projects/my-project/backend/services/api
ls-mcp  # ✅ Automatically detects .vscode/mcp.json from project root
```

#### Scenario 3: Multiple Config Files
```bash
cd ~/projects/my-project/backend/services
# If both ~/projects/my-project/.vscode/mcp.json and ~/projects/my-project/backend/.mcp.json exist
ls-mcp  # ✅ Detects the closer .mcp.json file in backend directory
```

### Configuration
- **Enabled by Default**: Directory bubbling is automatically enabled for the CLI
- **Optional Feature**: Can be disabled by modifying the MCPConfigService constructor options
- **Local Paths Only**: Only applies to paths marked as `'local'` type, never to global paths

### Benefits
- **Better DX**: Run `ls-mcp` from anywhere in your project structure
- **No More Navigation**: No need to navigate to project root to check MCP configurations
- **Intelligent Discovery**: Automatically finds the most relevant configuration file
- **Backward Compatible**: Existing behavior unchanged for users running from project root

## How to Extend the Project

### Adding Support for New Applications

To add support for a new application that uses MCP, you will need to:

1.  **Add the configuration file path:** In `src/services/mcp-path-registry.ts`, add the path to the application's MCP configuration file to the appropriate OS-specific paths object.
2.  **Update the server key (if necessary):** If the new application uses a different key in its configuration file to list the MCP servers, the `MCPConfigParser` already supports multiple keys and can be extended if needed.

### Adding New Features

You can extend the tool's functionality in several ways:

*   **Provide more server details:** You could enhance the tool to display more information about the MCP servers, such as their version, the number of tools and resources they provide, or their uptime.
*   **Add server management capabilities:** You could add features to allow users to start, stop, or restart MCP servers directly from the command line.
*   **Add a watch mode:** You could add a watch mode that continuously monitors the status of the MCP servers and updates the display in real-time.
*   **Add Linux support:** The architecture is ready for Linux support to be added by extending the `MCPPathRegistry`.

## How to Fix Bugs

If you encounter a bug, here's how you can approach fixing it:

1.  **Write a failing test:** The first step is to write a test case that reproduces the bug. The existing tests in the `__tests__` directory can serve as a good starting point. A failing test will help you confirm that you have identified the root cause of the bug and that your fix is effective.
2.  **Identify the source of the bug:** Bugs are most likely to occur in the file discovery, configuration parsing, or process detection logic. Use the debugger and add logging statements to trace the execution flow and pinpoint the exact location of the bug.
3.  **Implement the fix:** Once you have identified the source of the bug, implement a fix.
4.  **Run the tests:** After implementing the fix, run all the tests to ensure that your changes have not introduced any regressions.

## How to Refactor the Code

The codebase has been significantly refactored to improve maintainability and testability. Here are some potential areas for future improvement:

*   **Improve MCPServerManagerService test coverage:** Currently at 54.3%, this service needs more comprehensive testing, especially for process detection edge cases and different transport type handling.
*   **Add Linux support:** The architecture is ready for Linux support to be added by extending the `MCPPathRegistry` with Linux-specific paths.
*   **Performance optimization:** For systems with many MCP servers, consider adding caching and parallel processing optimizations.
*   **Enhanced error reporting:** Improve user-facing error messages and add debugging information for developers.

## Testing Guidelines

### Test Isolation
- **High-level tests** (app tests, edge case tests) must use proper mocking to prevent real filesystem access
- **Service tests** can test real functionality but only access fixture files within the project directory
- **CI compatibility** must be maintained across different operating systems

### Test Coverage Requirements
- All public methods must have test coverage
- Error scenarios must be tested
- Edge cases must be covered
- OS-specific functionality must be tested

### Mocking Strategy
- Use Node.js test runner's `mock.method()` for method mocking
- Mock filesystem operations to prevent real file access
- Use fixture files for testing configuration parsing
- Test both success and failure scenarios