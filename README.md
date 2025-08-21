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

## Usage: CLI

```bash
npx ls-mcp
```

### Debug Mode

To enable verbose debugging output, set the `NODE_DEBUG` environment variable:

```bash
# Enable debug logging for ls-mcp
NODE_DEBUG=ls-mcp npx ls-mcp

# Enable all debug logging
NODE_DEBUG=* npx ls-mcp
```

## Contributing

Please consult [CONTRIBUTING](./.github/CONTRIBUTING.md) for guidelines on contributing to this project.

## Author

**ls-mcp** © [Liran Tal](https://github.com/lirantal), Released under the [Apache-2.0](./LICENSE) License.
