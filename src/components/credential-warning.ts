import { styleText } from 'node:util'
import { type CredentialAnalysisResult } from '../types/mcp-config-service.types.js'

export default function CredentialWarningComponent (credentials: CredentialAnalysisResult | undefined): string {
  if (!credentials || !credentials.hasCredentials) {
    return ''
  }

  const { riskLevel, credentialVars } = credentials

  // Color coding based on risk level
  let riskColor: 'red' | 'yellow' | 'blue' | 'white'
  let riskIcon: string

  switch (riskLevel) {
    case 'high':
      riskColor = 'red'
      riskIcon = '🔴'
      break
    case 'medium':
      riskColor = 'yellow'
      riskIcon = '🟡'
      break
    case 'low':
      riskColor = 'blue'
      riskIcon = '🔵'
      break
    default:
      riskColor = 'white'
      riskIcon = '⚪'
  }

  const riskText = styleText([riskColor], `${riskIcon} ${riskLevel.toUpperCase()} RISK`)

  // Create summary of credential variables
  const credentialSummary = credentialVars
    .map(cv => `${cv.name}=${cv.value}`)
    .join(', ')

  return `${riskText} ${styleText(['dim'], `(${credentialVars.length} cred vars: ${credentialSummary})`)}`
}
