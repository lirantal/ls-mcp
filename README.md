<!-- markdownlint-disable -->

<p align="center"><h1 align="center">
  ls-mcp
</h1>

<p align="center">
  Detect Configured MCP (Model Context Protocol) in your local dev environment
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/ls-mcp"><img src="https://badgen.net/npm/v/ls-mcp" alt="npm version"/></a>
  <a href="https://www.npmjs.org/package/ls-mcp"><img src="https://badgen.net/npm/license/ls-mcp" alt="license"/></a>
  <a href="https://www.npmjs.org/package/ls-mcp"><img src="https://badgen.net/npm/dt/ls-mcp" alt="downloads"/></a>
  <a href="https://github.com/lirantal/ls-mcp/actions?workflow=CI"><img src="https://github.com/lirantal/ls-mcp/workflows/CI/badge.svg" alt="build"/></a>
  <a href="https://codecov.io/gh/lirantal/ls-mcp"><img src="https://badgen.net/codecov/c/github/lirantal/ls-mcp" alt="codecov"/></a>
  <a href="https://snyk.io/test/github/lirantal/ls-mcp"><img src="https://snyk.io/test/github/lirantal/ls-mcp/badge.svg" alt="Known Vulnerabilities"/></a>
  <a href="./SECURITY.md"><img src="https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg" alt="Responsible Disclosure Policy" /></a>
</p>

<div align="center">
  <img src="https://github.com/lirantal/ls-mcp/blob/main/.github/ls-mcp-logo.png?raw=true" alt="ls-mcp logo"/>
</div>

## Features

- **🔍 MCP Discovery**: Automatically detect MCP servers across various AI applications and agentic IDEs
- **📁 Directory Bubbling**: Intelligent discovery of project-scoped MCP configs from nested directories, supporting project-scoped MCP Server configuration and global configurations
- **🔄 Process Detection**: Real-time status of running MCP servers
- **🔒 Credential Analysis**: Security analysis of environment variables and API keys for potentially exposed credentials in MCP Servers

## Usage: CLI

```bash
npx ls-mcp
```

### JSON Output

To output results in JSON format (useful for programmatic consumption):

```bash
npx ls-mcp --json
```

This will return a structured JSON object containing:
- `mcpFiles`: Complete MCP server configurations organized by provider (only includes providers with configured servers)
- `summary`: Statistics including total servers, running servers, credential warnings, and transport breakdown

### Debug Mode

To enable verbose debugging output, set the `NODE_DEBUG` environment variable:

```bash
# Enable debug logging for ls-mcp
NODE_DEBUG=ls-mcp npx ls-mcp

# Enable all debug logging
NODE_DEBUG=* npx ls-mcp
```

## Documentation

For detailed information about the project architecture and features:

- **[Project Overview](./docs/project.md)**: Comprehensive project analysis and architecture
- **[Design Documentation](./docs/design.md)**: Technical design decisions and implementation details
- **[Requirements](./docs/requirements.md)**: Functional and non-functional requirements
- **[Directory Bubbling](./docs/directory-bubbling.md)**: Intelligent directory traversal feature
- **[URL Hostname Extraction](./docs/url-hostname-extraction.md)**: Clean display of hostnames for URL-based servers
- **[Credential Detection](./docs/credential-detection.md)**: Security analysis features

## Author

**ls-mcp** © [Liran Tal](https://github.com/lirantal), Released under the [Apache-2.0](./LICENSE) License.
