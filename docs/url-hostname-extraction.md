# URL Hostname Extraction Feature

## Overview

**Feature #80**: The URL hostname extraction feature enhances the readability of MCP server configurations by displaying only the hostname portion for URL-based servers in the SOURCE column, instead of the full URL.

## Problem Solved

Before this feature, URL-based MCP servers displayed their full URLs in the SOURCE column, which could be:
- **Verbose**: Long URLs with protocols, ports, and paths cluttered the output
- **Hard to Read**: Difficult to quickly identify the server location
- **Inconsistent**: Mixed display of commands and full URLs in the same column

**Before (Full URL Display):**
```
SOURCE                    | STATUS | NAME           | TRANSPORT
http://localhost:3000/mcp | ❌     | local-server  | http
https://api.example.com  | ❌     | api-server    | http
npx mcp-server           | ❌     | stdio-server  | stdio
```

**After (Hostname Display):**
```
SOURCE           | STATUS | NAME           | TRANSPORT
localhost        | ❌     | local-server  | http
api.example.com  | ❌     | api-server    | http
npx mcp-server  | ❌     | stdio-server  | stdio
```

## How It Works

### 1. URL Detection
The system automatically detects when an MCP server configuration contains a `url` field, indicating it's a URL-based server.

### 2. Hostname Extraction
Uses Node.js built-in `URL` constructor to parse URLs and extract the hostname portion:
- **Protocol**: Stripped from display (http://, https://, etc.)
- **Hostname**: Preserved and displayed (localhost, api.example.com, etc.)
- **Port**: Stripped from display (:3000, :8080, etc.)
- **Path**: Stripped from display (/mcp, /v1/mcp, etc.)
- **Query Parameters**: Stripped from display (?param=value)

### 3. Protocol Handling
Automatically adds `http://` protocol if none is specified for proper parsing:
```typescript
// Input: "localhost:3000"
// Processed: "http://localhost:3000"
// Output: "localhost"
```

### 4. Fallback Handling
If URL parsing fails for any reason, the original string is displayed as a fallback:
```typescript
// Input: "invalid-url"
// Parsing fails → fallback to original
// Output: "invalid-url"
```

## Implementation Details

### Core Utility Function
Located in `src/utils/url-utils.ts`:
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

### Service Integration
The feature is integrated into two key services:

#### MCPConfigService
- Extracts hostname during server configuration conversion
- Updates the `source` field when `serverConfig.url` is present
- Maintains backward compatibility for non-URL servers

#### MCPServerManagerService
- Sets the `source` field to hostname when URL is available
- Ensures consistent display across all server information

### Type Definitions
Updated `src/types/mcp-config-service.types.ts` to include optional `url` field:
```typescript
export interface MCPServerConfig {
  name: string
  command?: string
  args?: string[]
  type?: string
  url?: string  // ← New field for URL-based servers
  env?: Record<string, string>
}
```

## URL Format Support

### Supported Protocols
- **HTTP**: `http://localhost:3000`
- **HTTPS**: `https://api.example.com`
- **Custom**: `ws://localhost:8080`, `tcp://192.168.1.100`
- **Protocol-less**: `localhost:3000` (auto-adds `http://`)

### Hostname Types
- **Domain Names**: `api.example.com`, `localhost`
- **IP Addresses**: `192.168.1.100`, `::1` (IPv6)
- **Subdomains**: `dev.api.example.com`
- **Local Development**: `localhost`, `127.0.0.1`

### Edge Cases Handled
- **Missing Protocol**: Automatically adds `http://`
- **Invalid URLs**: Graceful fallback to original string
- **Empty Strings**: Returns empty string
- **Malformed URLs**: Fallback to original string

## Example Transformations

### Standard URLs
```
Input: "http://localhost:3000/mcp"
Output: "localhost"

Input: "https://api.example.com/v1/mcp"
Output: "api.example.com"

Input: "http://192.168.1.100:8080"
Output: "192.168.1.100"
```

### Protocol-less URLs
```
Input: "localhost:3000"
Output: "localhost"

Input: "api.example.com"
Output: "api.example.com"

Input: "192.168.1.100:8080"
Output: "192.168.1.100"
```

### Edge Cases
```
Input: "invalid-url"
Output: "invalid-url" (fallback)

Input: ""
Output: ""

Input: "http://"
Output: "" (empty hostname)
```

## Benefits

### 1. Improved Readability
- **Cleaner Output**: SOURCE column is more concise and focused
- **Better Scanning**: Users can quickly identify server locations
- **Consistent Format**: All URL-based servers display consistently

### 2. Enhanced User Experience
- **Faster Recognition**: Hostnames are easier to read than full URLs
- **Reduced Clutter**: Less visual noise in the output
- **Professional Appearance**: Clean, polished display

### 3. Better Workflow
- **Quick Identification**: Developers can rapidly identify server locations
- **Easier Debugging**: Clearer server information for troubleshooting
- **Improved Documentation**: Cleaner output for sharing and documentation

## Testing

### Test Coverage
The feature is thoroughly tested with comprehensive test cases:

#### Unit Tests (`__tests__/url-utils.test.ts`)
- ✅ HTTP/HTTPS URL parsing
- ✅ Protocol-less URL handling
- ✅ IP address extraction
- ✅ Subdomain handling
- ✅ Complex path handling
- ✅ Query parameter handling
- ✅ Port number handling
- ✅ Error handling and fallbacks

#### Integration Tests
- ✅ MCPConfigService integration
- ✅ MCPServerManagerService integration
- ✅ End-to-end URL processing

#### Test Fixtures
Located in `__tests__/__fixtures__/mcp-config-service/url-based-servers.json`:
```json
{
  "mcpServers": {
    "localhost-server": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    },
    "api-server": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

## Future Enhancements

### Potential Improvements
- **Custom Hostname Mapping**: Allow users to define custom hostname aliases
- **Port Display Option**: Optional flag to show/hide port numbers
- **Protocol Display Option**: Optional flag to show/hide protocols
- **Hostname Validation**: Additional validation for hostname formats

### Configuration Options
- **Display Preferences**: User-configurable display options
- **Custom Parsing Rules**: Extensible parsing for special URL formats
- **Internationalization**: Support for international domain names

## Troubleshooting

### Common Issues

#### Hostname Not Extracted
1. **Check URL Format**: Ensure the URL is properly formatted
2. **Verify Field Name**: Confirm the field is named `url` (not `URL` or `serverUrl`)
3. **Check Parsing**: Verify the URL can be parsed by Node.js URL constructor

#### Fallback to Original String
1. **URL Validation**: Check if the URL string is valid
2. **Protocol Issues**: Ensure protocol is supported or protocol-less format
3. **Special Characters**: Check for unusual characters that might break parsing

#### Unexpected Output
1. **Empty Hostname**: URL might have empty hostname portion
2. **IP Address Display**: Verify IP address format is correct
3. **Subdomain Handling**: Check subdomain format and parsing

### Debug Information
To debug URL hostname extraction issues:
- Check the original URL string format
- Verify URL parsing with Node.js URL constructor
- Review service integration points
- Check test coverage for similar scenarios

## Conclusion

The URL hostname extraction feature significantly improves the user experience of the `ls-mcp` tool by:

- **Enhancing Readability**: Cleaner, more focused SOURCE column display
- **Improving Usability**: Faster server identification and better workflow
- **Maintaining Compatibility**: Backward compatible with existing configurations
- **Providing Robustness**: Graceful handling of edge cases and errors

This feature represents a thoughtful enhancement that addresses real user needs while maintaining the tool's reliability and performance characteristics.
