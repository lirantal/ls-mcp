# Test Suite Documentation

This directory contains comprehensive tests for the `ls-mcp` command-line tool.

## Test Coverage

The test suite provides **80.91% statement coverage** and covers the following areas:

### Core Functionality Tests (`app.test.ts`)

- **MCPFiles Class**: Tests the main class responsible for finding and parsing MCP configuration files
- **CLI Integration**: Tests the command-line interface behavior
- **Configuration File Parsing**: Tests parsing of different MCP configuration formats (Claude Desktop, IntelliJ, etc.)

### Service Tests

#### MCPConfigLinterService (`mcp-config-linter-service.test.ts`)

- JSON syntax validation (including JSONC with comments)
- MCP server configuration parsing
- Error handling for invalid/missing files
- Server counting functionality

#### MCPServerManagerService (`mcp-server-manager-service.test.ts`)

- Server configuration initialization
- Transport type handling (stdio, sse, http)
- Source command formatting
- Process detection capabilities

#### RenderService (`render-service.test.ts`)

- Output formatting for MCP groups
- Server status display
- Console output testing with mocks

### Error Handling and Edge Cases

#### Edge Cases (`edge-cases.test.ts`)

- Empty configurations
- Large JSON files (100+ servers)
- Corrupted/invalid files
- Permission denied scenarios
- Duplicate file paths
- Unusual JSON structures

## Test Fixtures

The `__fixtures__` directory contains sample configuration files:

- `mcp.json` - Standard Claude Desktop format
- `subdir/mcp2.json` - Alternative server configuration
- `intellij-empty-with-comment.json` - IntelliJ format with comments

## Running Tests

```bash
# Run a single test file
node --import tsx --test __tests__/render-service.test.ts

# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# View coverage report
npm run coverage:view
```

## Test Framework

The tests use Node.js's built-in test runner (`node:test`) with the following features:

- **Async/await support** for testing asynchronous operations
- **Mocking capabilities** for isolating units under test
- **Process spawning** for CLI integration tests
- **File system operations** for testing file handling
- **Error boundary testing** for robustness validation

## Test Categories

### Unit Tests

Test individual functions and classes in isolation:

- Configuration parsing
- Server management
- Rendering services

### Integration Tests

Test how components work together:

- CLI with real file system
- Service interactions
- End-to-end workflows

### CLI Tests

Test the command-line interface behavior:

- Exit codes
- Output formatting
- Error handling
- Process management

### Performance Tests

Ensure the tool performs well:

- Startup time benchmarks
- Memory usage monitoring
- Large configuration handling

## Key Testing Patterns

### 1. Fixture-Based Testing

Uses real configuration files to test parsing behavior:

```typescript
const configPath = path.resolve('__tests__/__fixtures__/mcp.json')
const linter = new MCPConfigLinterService(configPath)
```

### 2. Temporary File Testing

Creates temporary files for testing edge cases:

```typescript
const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-test-'))
const invalidJsonPath = path.join(tempDir, 'invalid.json')
await fs.writeFile(invalidJsonPath, 'invalid content')
```

### 3. Process Spawning for CLI Tests

Tests the actual CLI executable:

```typescript
const { stdout } = await execFileAsync('node', [cliPath], {
  timeout: 10000
})
```

### 4. Mock-Based Testing

Uses Node.js test runner mocks for isolation:

```typescript
const consoleLogMock = mock.method(console, 'log')
// ... perform operations ...
assert.ok(consoleLogMock.mock.callCount() > 0)
```

## Adding New Tests

When adding new features, ensure to add tests for:

1. **Happy path scenarios** - normal usage
2. **Error conditions** - invalid inputs, missing files
3. **Edge cases** - empty data, large inputs, unusual formats
4. **CLI behavior** - if the feature affects command-line usage

### Test File Naming Convention

- `*.test.ts` - All test files use this suffix
- Match the source file name when testing specific modules
- Use descriptive names for integration/scenario tests

## Coverage Goals

- **Statements**: > 80% (currently 80.91%)
- **Branches**: > 70% (currently 73.61%)
- **Functions**: > 90% (currently 90.9%)
- **Lines**: > 80% (currently 80.91%)

The test suite provides robust coverage while being maintainable and fast-running, ensuring the `ls-mcp` tool works reliably across different environments and configurations.
