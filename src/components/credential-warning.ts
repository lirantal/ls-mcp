import { styleText } from 'node:util'
import { type CredentialAnalysisResult } from '../types/mcp-config-service.types.js'

export default function CredentialWarningComponent (credentials: CredentialAnalysisResult | undefined): string {
  if (!credentials || !credentials.hasCredentials) {
    return ''
  }

  const { riskLevel, credentialVars } = credentials

  // Color coding based on risk level
  let riskColor: 'red' | 'blue'
  let riskIcon: string

  switch (riskLevel) {
    case 'high':
      riskColor = 'red'
      riskIcon = styleText(['red'], '●')
      break
    case 'low':
      riskColor = 'blue'
      riskIcon = styleText(['blue'], '●')
      break
    default:
      riskColor = 'blue'
      riskIcon = styleText(['blue'], '●')
  }

  const riskText = styleText([riskColor], `${riskIcon} ${riskLevel.toUpperCase()} RISK`)

  // Group credentials by source for better organization
  const credsBySource = credentialVars.reduce((acc, cv) => {
    const source = cv.source || 'env' // Default to env for backward compatibility
    if (!acc[source]) {
      acc[source] = []
    }
    acc[source].push(cv)
    return acc
  }, {} as Record<string, typeof credentialVars>)

  // Create summary with source grouping
  const sourceSummaries = Object.entries(credsBySource).map(([source, creds]) => {
    const sourceIcon = getSourceIcon(source)
    const credList = creds.map(cv => `${cv.name}=${cv.value}`).join(', ')
    return `${sourceIcon}${source}: ${credList}`
  })

  const credentialSummary = sourceSummaries.join(' | ')

  return `${riskText} ${styleText(['dim'], `(${credentialVars.length} creds: ${credentialSummary})`)}`
}

/**
 * Get an icon/symbol for different credential sources
 */
function getSourceIcon (source: string): string {
  switch (source) {
    case 'env':
      return '🌱 ' // Environment variable
    case 'args':
      return '⚡ ' // Command argument
    case 'headers':
      return '🔗 ' // HTTP header
    default:
      return '📋 ' // Unknown/generic
  }
}
