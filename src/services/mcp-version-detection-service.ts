import { PackageVersionInfo } from '../types/mcp-config-service.types.js'

/**
 * Service for detecting version information from MCP server configurations
 * Specifically handles npx-based server commands to determine if they use
 * pinned versions or implicit latest versions
 */
export class MCPVersionDetectionService {
  /**
   * Analyze a server configuration to extract version information
   * @param command - The command used to run the server
   * @param args - Array of arguments passed to the command
   * @returns PackageVersionInfo if analysis is possible, null otherwise
   */
  analyzeServerVersion (command: string, args?: string[]): PackageVersionInfo | null {
    // Only analyze npx commands
    if (command !== 'npx') {
      return null
    }

    // Need args to extract package information
    if (!args || args.length === 0) {
      return null
    }

    const packageName = this.extractPackageName(args)
    if (!packageName) {
      return null
    }

    const { name, version } = this.parsePackageVersion(packageName)
    const isPinned = this.isPinnedVersion(version)

    return {
      packageName: name,
      version,
      isPinned,
      isLatest: !isPinned
    }
  }

  /**
   * Extract the package name from npx arguments
   * @param args - Array of arguments passed to npx
   * @returns The package name/spec or null if not found
   */
  extractPackageName (args: string[]): string | null {
    if (!args || args.length === 0) {
      return null
    }

    // Look for -y flag and get the next argument
    const yIndex = args.indexOf('-y')
    if (yIndex !== -1 && yIndex + 1 < args.length) {
      return args[yIndex + 1]
    }

    // Look for --yes flag and get the next argument
    const yesIndex = args.indexOf('--yes')
    if (yesIndex !== -1 && yesIndex + 1 < args.length) {
      return args[yesIndex + 1]
    }

    // If no -y flag, find the first argument that doesn't start with -
    // Skip over option values (arguments following options that take values)
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (!arg.startsWith('-')) {
        // Check if this might be a value for a previous option
        if (i > 0) {
          const prevArg = args[i - 1]
          // Known options that take values
          if (prevArg === '--registry' || prevArg === '-r' || prevArg === '--package' || prevArg === '-p') {
            continue // Skip this as it's an option value
          }
        }
        return arg
      }
    }

    return null
  }

  /**
   * Parse a package specification to extract name and version
   * @param packageSpec - Package specification (e.g., "package@1.0.0" or "package")
   * @returns Object with name and optional version
   */
  parsePackageVersion (packageSpec: string): { name: string; version?: string } {
    if (!packageSpec) {
      return { name: '', version: undefined }
    }

    // Handle scoped packages (e.g., @org/package@1.0.0)
    if (packageSpec.startsWith('@')) {
      const parts = packageSpec.split('@')
      if (parts.length === 2) {
        // Just @org/package with no version
        return { name: packageSpec, version: undefined }
      } else if (parts.length === 3) {
        // @org/package@version
        return {
          name: `@${parts[1]}`,
          version: parts[2]
        }
      }
    }

    // Handle regular packages (e.g., package@1.0.0)
    const atIndex = packageSpec.lastIndexOf('@')
    if (atIndex > 0) { // atIndex > 0 to avoid matching scoped packages starting with @
      return {
        name: packageSpec.substring(0, atIndex),
        version: packageSpec.substring(atIndex + 1)
      }
    }

    // No version specified
    return { name: packageSpec, version: undefined }
  }

  /**
   * Determine if a version represents a pinned version
   * @param version - The version string to check
   * @returns true if the version is pinned, false if it's latest/implicit
   */
  isPinnedVersion (version?: string): boolean {
    if (!version) {
      return false // No version = latest
    }

    if (version === 'latest') {
      return false // Explicit latest
    }

    // Any other version specification is considered pinned
    return true
  }
}
