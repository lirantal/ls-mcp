import { styleText } from 'node:util'
import type { PackageVersionInfo } from '../types/mcp-config-service.types.js'

export default function render (versionInfo?: PackageVersionInfo): string {
  if (!versionInfo) {
    return ''
  }

  const version = versionInfo.version || 'LATEST'
  const displayVersion = version === 'latest' ? 'LATEST' : version

  if (versionInfo.isPinned) {
    // Green circle for pinned versions (stable/safe)
    return styleText(['green'], '●') + ' ' + displayVersion
  } else {
    // Red circle for latest versions (higher risk)
    return styleText(['red'], '●') + ' ' + 'LATEST'
  }
}
