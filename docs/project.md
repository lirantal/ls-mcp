# Project Analysis: ls-mcp

## Purpose

`ls-mcp` is a command-line tool for detecting and listing MCP (Model Context Protocol) servers in a local development environment. It helps developers quickly see which MCP servers are configured on their system and whether they are currently running.

## How it Works

The tool works by scanning for known MCP configuration files associated with various code editors and tools. Here's a high-level overview of the process:

1.  **File Discovery:** The tool starts by looking for MCP configuration files in predefined locations. These locations are specific to different applications (like VS Code, Claude, Cursor, etc.) and operating systems (macOS, Windows, Linux).

2.  **Configuration Parsing:** Once a configuration file is found, it is parsed to extract the list of configured MCP servers. The tool can handle standard JSON and JSON with comments (JSONC). It's designed to be flexible and can find server configurations under different keys like `servers`, `mcp.servers`, `mcpServers`, and `context_servers` to support a variety of applications.

3.  **Process Detection:** For each configured MCP server, the tool checks if it is currently running. It does this by executing system commands (`ps` on macOS/Linux and `powershell` on Windows) to get a list of all active processes. It then compares the command from the MCP configuration with the running processes to determine the server's status. The tool includes specific logic to handle common ways of running MCP servers, such as using `uvx` or `npx`.

4.  **Output Rendering:** Finally, all the gathered information is displayed in a formatted table in the console. The table shows the server's status (running or stopped), name, source (the command used to start it), and transport protocol.

## Project Structure

The project is a TypeScript-based Node.js application with a clear and modular structure:

*   `src/main.ts`: This file contains the core logic for finding and processing MCP configuration files.
*   `src/bin/cli.ts`: This is the entry point for the command-line interface. It orchestrates the process of finding, parsing, and displaying MCP server information.
*   `src/services/mcp-config-linter-service.ts`: This service is responsible for reading and parsing the MCP configuration files.
*   `src/services/mcp-server-manager-service.ts`: This service is responsible for checking the status of the MCP servers by inspecting the system's running processes.
*   `src/services/render-service.ts`: This service is responsible for rendering the final output in a user-friendly format in the console.
*   `__tests__/`: This directory contains the tests for the project.

## How to Extend the Project

### Adding Support for New Applications

To add support for a new application that uses MCP, you will need to:

1.  **Add the configuration file path:** In `src/main.ts`, add the path to the application's MCP configuration file to the `osSpecificPaths` object. You will need to provide the path for each supported operating system.
2.  **Update the server key (if necessary):** If the new application uses a different key in its configuration file to list the MCP servers, you will need to update the `getMCPServers` method in `src/services/mcp-config-linter-service.ts` to recognize this new key.

### Adding New Features

You can extend the tool's functionality in several ways:

*   **Provide more server details:** You could enhance the tool to display more information about the MCP servers, such as their version, the number of tools and resources they provide, or their uptime.
*   **Add server management capabilities:** You could add features to allow users to start, stop, or restart MCP servers directly from the command line.
*   **Add a watch mode:** You could add a watch mode that continuously monitors the status of the MCP servers and updates the display in real-time.

## How to Fix Bugs

If you encounter a bug, here's how you can approach fixing it:

1.  **Write a failing test:** The first step is to write a test case that reproduces the bug. The existing tests in the `__tests__` directory can serve as a good starting point. A failing test will help you confirm that you have identified the root cause of the bug and that your fix is effective.
2.  **Identify the source of the bug:** Bugs are most likely to occur in the file discovery, configuration parsing, or process detection logic. Use the debugger and add logging statements to trace the execution flow and pinpoint the exact location of the bug.
3.  **Implement the fix:** Once you have identified the source of the bug, implement a fix.
4.  **Run the tests:** After implementing the fix, run all the tests to ensure that your changes have not introduced any regressions.

## How to Refactor the Code

The codebase is generally well-structured, but there are always opportunities for improvement. Here are some potential areas for refactoring:

*   **Simplify complex methods:** The `isRunning` method in `MCPServerManagerService` is quite large and complex. It could be broken down into smaller, more focused methods to improve its readability and maintainability.
*   **Improve type safety:** In some parts of the code, the `any` type is used. Replacing `any` with more specific types would improve the type safety of the code and make it easier to reason about.
*   **Use a more robust process detection library:** Instead of manually parsing the output of system commands, you could use a third-party library for process detection. This would make the code more robust and easier to maintain.