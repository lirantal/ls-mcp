export class CredentialDetectionService {
  /**
   * Credential patterns grouped by risk level for easier maintenance
   */
  private static readonly CREDENTIAL_PATTERNS = {
    high: [
      // API Keys and Tokens
      /api[_-]?key/i,
      /api[_-]?token/i,
      /access[_-]?token/i,
      /secret[_-]?key/i,
      /private[_-]?key/i,

      // Authentication Tokens
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

      // Specific service patterns
      /openai[_-]?api[_-]?key/i,
      /anthropic[_-]?api[_-]?key/i,
      /firecrawl[_-]?api[_-]?key/i,
      /github[_-]?token/i,
      /gitlab[_-]?token/i,
      /bitbucket[_-]?token/i,

      // Database passwords
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
      /google[_-]?api[_-]?key/i,
      /gemini[_-]?api[_-]?key/i,
      /claude[_-]?api[_-]?key/i
    ],
    low: [
      // Organization and Account IDs
      /org[_-]?id/i,
      /organization[_-]?id/i,
      /account[_-]?id/i,
      /user[_-]?id/i,
      /openai[_-]?org[_-]?id/i
    ]
  }

  /**
   * Check if an environment variable name suggests it might contain credentials
   */
  static isPotentialCredential (envVarName: string): boolean {
    return this.CREDENTIAL_PATTERNS.high.some(pattern => pattern.test(envVarName)) ||
           this.CREDENTIAL_PATTERNS.low.some(pattern => pattern.test(envVarName))
  }

  /**
   * Analyze environment variables and return credential detection results
   */
  static analyzeEnvironmentVariables (env: Record<string, string> | undefined): CredentialAnalysisResult {
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
          riskLevel: this.assessRiskLevel(name)
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
  private static maskValue (value: string): string {
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
  private static assessRiskLevel (name: string): 'low' | 'high' {
    // Check if it matches any high-risk patterns
    if (this.CREDENTIAL_PATTERNS.high.some(pattern => pattern.test(name))) {
      return 'high'
    }

    // If it matches low-risk patterns, it's low risk
    if (this.CREDENTIAL_PATTERNS.low.some(pattern => pattern.test(name))) {
      return 'low'
    }

    // Default to high risk for any other credential-like variables
    return 'high'
  }

  /**
   * Calculate overall risk level based on all credential variables
   */
  private static calculateOverallRiskLevel (credentialVars: CredentialVariable[]): 'none' | 'low' | 'high' {
    if (credentialVars.length === 0) {
      return 'none'
    }

    const hasHighRisk = credentialVars.some(v => v.riskLevel === 'high')

    if (hasHighRisk) {
      return 'high'
    }

    return 'low'
  }
}

export interface CredentialVariable {
  name: string
  value: string
  riskLevel: 'low' | 'high'
}

export interface CredentialAnalysisResult {
  hasCredentials: boolean
  credentialVars: CredentialVariable[]
  riskLevel: 'none' | 'low' | 'high'
}
