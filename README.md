<!-- markdownlint-disable -->

<p align="center"><h1 align="center">
  ls-mcp
</h1>

<p align="center">
  Detect and list MCPs in your local dev environment (Model Context Protocol)
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

- **🔍 MCP Discovery**: Automatically detect MCP servers across multiple AI applications
- **📁 Directory Bubbling**: Intelligent discovery of project-scoped MCP configs from nested directories
- **🔄 Process Detection**: Real-time status of running MCP servers
- **🔒 Credential Analysis**: Security analysis of environment variables and API keys
- **🌐 URL Hostname Extraction**: Clean display of hostnames for URL-based MCP servers
- **🌍 Cross-Platform**: Support for Windows and macOS (Linux support coming soon)
- **⚡ High Performance**: Fast discovery with intelligent caching and optimization

## Usage: CLI

```bash
npx ls-mcp
```

### Directory Bubbling

The tool now includes intelligent directory bubbling for better Developer Experience. Run `ls-mcp` from anywhere in your project structure:

```bash
# From project root (traditional behavior)
cd ~/projects/my-project
npx ls-mcp

# From nested directory (new feature!)
cd ~/projects/my-project/backend/services/api
npx ls-mcp  # Automatically finds .vscode/mcp.json from project root
```

### URL Hostname Extraction

The tool now displays clean hostnames for URL-based MCP servers instead of full URLs:

```bash
# Before: Full URLs cluttered the SOURCE column
SOURCE                    | STATUS | NAME           | TRANSPORT
http://localhost:3000/mcp | ❌     | local-server  | http

# After: Clean hostnames for better readability
SOURCE      | STATUS | NAME           | TRANSPORT
localhost   | ❌     | local-server  | http
```

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

## Contributing

Please consult [CONTRIBUTING](./.github/CONTRIBUTING.md) for guidelines on contributing to this project.

## Author

**ls-mcp** © [Liran Tal](https://github.com/lirantal), Released under the [Apache-2.0](./LICENSE) License.
