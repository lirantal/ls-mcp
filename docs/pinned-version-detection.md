# Pinned Version Detection for MCP Servers

## Overview

This feature adds the capability to detect whether MCP servers configured with STDIO transport are using pinned versions or implicit latest versions. This information is crucial for understanding dependency management and stability of MCP server configurations.

## Feature Requirements

### Definitions

- **Pinned Version**: A server package specified with an explicit version using npm semver syntax (e.g., `mcp-server-nodejs-api-docs@1.1.3`)
- **Implicit Latest Version**: A server package without version specification or with `@latest`, which resolves to the latest available version from the npm registry

### Detection Rules

1. **Command Detection**: Only applicable to servers with `command: "npx"`
2. **Package Name Extraction**:
   - If args contain `-y` flag: the next element after `-y` is the package name
   - If no `-y` flag: the first element in args (unless it starts with `-`, indicating another npx option)
3. **Version Classification**:
   - **Pinned**: Package name contains `@` followed by a specific version (not `latest`)
   - **Latest**: Package name has no `@` or ends with `@latest`

## Architecture Design

### Service Design (SOLID Principles)

Following the Single Responsibility Principle, we'll create a dedicated service for version detection rather than bloating the existing `MCPConfigService`.

```
src/services/
├── mcp-version-detection-service.ts  (NEW)
├── mcp-config-service.ts            (MODIFIED)
└── ...
```

### New Service: MCPVersionDetectionService

**Responsibilities:**
- Extract package names from npx commands
- Determine version pinning status
- Parse semantic versions
- Provide version analysis utilities

**Interface:**
```typescript
interface PackageVersionInfo {
  packageName: string
  version?: string
  isPinned: boolean
  isLatest: boolean
}

interface MCPVersionDetectionService {
  analyzeServerVersion(command: string, args?: string[]): PackageVersionInfo | null
  extractPackageName(args: string[]): string | null
  parsePackageVersion(packageSpec: string): { name: string; version?: string }
  isPinnedVersion(version?: string): boolean
}
```

### Integration Points

1. **MCPConfigService.convertToMCPServerInfo()**: 
   - Add version analysis to the server info creation process
   - Call `MCPVersionDetectionService.analyzeServerVersion()`

2. **MCPServerInfo Type Enhancement**:
   - Add optional `versionInfo?: PackageVersionInfo` field

### Data Flow

```
Config File → MCPConfigParser → MCPConfigService.convertToMCPServerInfo() → 
MCPVersionDetectionService.analyzeServerVersion() → Enhanced MCPServerInfo
```

## Implementation Plan

### Phase 1: Core Service Implementation

1. **Create MCPVersionDetectionService**
   - Implement package name extraction logic
   - Add version parsing capabilities
   - Handle edge cases (no args, invalid formats)

2. **Update Type Definitions**
   - Add `PackageVersionInfo` interface
   - Extend `MCPServerInfo` with version information

### Phase 2: Integration

3. **Modify MCPConfigService**
   - Import and instantiate version detection service
   - Update `convertToMCPServerInfo()` method
   - Add version analysis for STDIO servers

4. **Update Related Services**
   - Ensure version info flows through to server managers
   - Update serialization/display logic if needed

### Phase 3: Testing & Documentation

5. **Comprehensive Testing**
   - Unit tests for version detection service
   - Integration tests with various config formats
   - Edge case handling

6. **Documentation Updates**
   - API documentation
   - Usage examples
   - Migration guide if needed

## Test Plan

### Unit Tests - MCPVersionDetectionService

```typescript
describe('MCPVersionDetectionService', () => {
  describe('analyzeServerVersion', () => {
    it('should detect pinned version with -y flag')
    it('should detect latest version with -y flag')
    it('should detect pinned version without -y flag')
    it('should detect latest version without -y flag')
    it('should return null for non-npx commands')
    it('should handle empty args array')
    it('should ignore npx options starting with -')
  })

  describe('extractPackageName', () => {
    it('should extract package after -y flag')
    it('should extract first non-option argument')
    it('should return null for invalid args')
  })

  describe('parsePackageVersion', () => {
    it('should parse package@version format')
    it('should parse package without version')
    it('should handle @latest suffix')
    it('should handle scoped packages (@org/package)')
  })
})
```

### Integration Tests - MCPConfigService

```typescript
describe('MCPConfigService Integration', () => {
  it('should add version info to server info for npx servers')
  it('should not add version info for non-npx servers')
  it('should handle mixed server configurations')
})
```

### Test Cases

| Command | Args | Expected Package | Expected Status |
|---------|------|------------------|-----------------|
| `npx` | `["-y", "pkg@1.0.0"]` | `pkg` | Pinned (1.0.0) |
| `npx` | `["-y", "pkg@latest"]` | `pkg` | Latest |
| `npx` | `["-y", "pkg"]` | `pkg` | Latest |
| `npx` | `["pkg@1.0.0"]` | `pkg` | Pinned (1.0.0) |
| `npx` | `["--yes", "pkg"]` | `pkg` | Latest |
| `npx` | `["-q", "-y", "pkg"]` | `pkg` | Latest |
| `docker` | `["run", "image"]` | N/A | N/A |

## Implementation Guidelines

### Code Style

- Follow existing TypeScript conventions in the codebase
- Use proper error handling and logging
- Include comprehensive JSDoc comments
- Follow functional programming principles where appropriate

### Error Handling

- Graceful degradation: if version detection fails, continue without version info
- Detailed logging for debugging purposes
- Type-safe error handling with proper error messages

### Performance Considerations

- Minimal overhead for version detection
- Lazy evaluation where possible
- Avoid unnecessary string operations

### Backwards Compatibility

- Version info is optional and additive
- Existing functionality remains unchanged
- No breaking changes to public APIs

## Future Enhancements

### Potential Extensions

1. **Version Comparison**: Compare configured versions with latest available
2. **Security Advisories**: Check for known vulnerabilities in pinned versions
3. **Update Recommendations**: Suggest version updates
4. **Package Registry Integration**: Fetch real-time version information

### Monitoring & Analytics

- Track version pinning patterns across configurations
- Identify commonly used packages and versions
- Provide insights on configuration health

## Migration Strategy

This is a non-breaking additive feature:

1. **Phase 1**: Deploy with feature flag (optional)
2. **Phase 2**: Enable by default
3. **Phase 3**: Expose in user interfaces

## Success Criteria

- [ ] Accurately detects pinned vs latest versions for npx commands
- [ ] Handles all edge cases without breaking existing functionality
- [ ] Maintains high test coverage (>90%)
- [ ] Performance impact < 5ms per server configuration
- [ ] Zero breaking changes to existing APIs
- [ ] Comprehensive documentation and examples

## Risk Assessment

### Low Risk
- Additive feature with minimal impact on existing code
- Clear separation of concerns with dedicated service
- Comprehensive test coverage planned

### Mitigation Strategies
- Feature flag for gradual rollout
- Extensive testing with real-world configurations
- Fallback mechanisms for parsing failures
- Clear error logging for debugging