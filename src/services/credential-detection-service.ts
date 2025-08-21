export class CredentialDetectionService {
  /**
   * Common patterns for environment variable names that might contain credentials
   */
  private static readonly CREDENTIAL_PATTERNS = [
    // API Keys
    /api[_-]?key/i,
    /api[_-]?token/i,
    /access[_-]?token/i,
    /secret[_-]?key/i,
    /private[_-]?key/i,
    
    // Authentication
    /auth[_-]?token/i,
    /bearer[_-]?token/i,
    /jwt[_-]?token/i,
    /oauth[_-]?token/i,
    
    // Passwords
    /password/i,
    /passwd/i,
    /pwd/i,
    
    // Credentials
    /credential/i,
    /creds/i,
    
    // Organization and Account IDs
    /org[_-]?id/i,
    /organization[_-]?id/i,
    /account[_-]?id/i,
    /user[_-]?id/i,
    
    // Specific service patterns
    /openai[_-]?api[_-]?key/i,
    /openai[_-]?org[_-]?id/i,
    /anthropic[_-]?api[_-]?key/i,
    /firecrawl[_-]?api[_-]?key/i,
    /github[_-]?token/i,
    /gitlab[_-]?token/i,
    /bitbucket[_-]?token/i,
    
    // Database
    /db[_-]?password/i,
    /database[_-]?password/i,
    /redis[_-]?password/i,
    /postgres[_-]?password/i,
    /mysql[_-]?password/i,
    
    // Cloud services
    /aws[_-]?secret[_-]?access[_-]?key/i,
    /aws[_-]?access[_-]?key[_-]?id/i,
    /azure[_-]?key/i,
    /gcp[_-]?key/i,
    /google[_-]?api[_-]?key/i
  ]

  /**
   * Check if an environment variable name suggests it might contain credentials
   */
  static isPotentialCredential(envVarName: string): boolean {
    return this.CREDENTIAL_PATTERNS.some(pattern => pattern.test(envVarName))
  }

  /**
   * Analyze environment variables and return credential detection results
   */
  static analyzeEnvironmentVariables(env: Record<string, string> | undefined): CredentialAnalysisResult {
    if (!env || typeof env !== 'object') {
      return {
        hasCredentials: false,
        credentialVars: [],
        riskLevel: 'none'
      }
    }

    const credentialVars: CredentialVariable[] = []
    
    for (const [name, value] of Object.entries(env)) {
      if (this.isPotentialCredential(name)) {
        credentialVars.push({
          name,
          value: this.maskValue(value),
          riskLevel: this.assessRiskLevel(name, value)
        })
      }
    }

    const hasCredentials = credentialVars.length > 0
    const riskLevel = this.calculateOverallRiskLevel(credentialVars)

    return {
      hasCredentials,
      credentialVars,
      riskLevel
    }
  }

  /**
   * Mask sensitive values for display (show only first and last character)
   */
  private static maskValue(value: string): string {
    if (!value || value.length <= 2) {
      return value
    }
    
    const first = value.charAt(0)
    const last = value.charAt(value.length - 1)
    const maskedLength = Math.min(value.length - 2, 8) // Show max 8 asterisks
    
    return `${first}${'*'.repeat(maskedLength)}${last}`
  }

  /**
   * Assess risk level for a specific credential variable
   */
  private static assessRiskLevel(name: string, value: string): 'low' | 'medium' | 'high' {
    // High risk: API keys, tokens, passwords
    if (/api[_-]?key|api[_-]?token|access[_-]?token|password|secret[_-]?key/i.test(name)) {
      return 'high'
    }
    
    // Medium risk: authentication tokens, OAuth
    if (/auth[_-]?token|oauth[_-]?token|jwt[_-]?token/i.test(name)) {
      return 'medium'
    }
    
    // Low risk: other credential-like variables
    return 'low'
  }

  /**
   * Calculate overall risk level based on all credential variables
   */
  private static calculateOverallRiskLevel(credentialVars: CredentialVariable[]): 'none' | 'low' | 'medium' | 'high' {
    if (credentialVars.length === 0) {
      return 'none'
    }

    const hasHighRisk = credentialVars.some(v => v.riskLevel === 'high')
    const hasMediumRisk = credentialVars.some(v => v.riskLevel === 'medium')

    if (hasHighRisk) {
      return 'high'
    }

    if (hasMediumRisk) {
      return 'medium'
    }

    return 'low'
  }
}

export interface CredentialVariable {
  name: string
  value: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface CredentialAnalysisResult {
  hasCredentials: boolean
  credentialVars: CredentialVariable[]
  riskLevel: 'none' | 'low' | 'medium' | 'high'
}
