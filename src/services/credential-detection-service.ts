export class CredentialDetectionService {
  /**
   * Credential patterns grouped by risk level for easier maintenance
   */
  private static readonly CREDENTIAL_PATTERNS = {
    high: [
      // Generic Key and Token patterns (broad matching)
      /.*key.*/i,
      /.*token.*/i,

      // Passwords
      /.*password.*/i,
      /.*passwd.*/i,
      /.*pwd.*/i,

      // Credentials and Secrets
      /.*credential.*/i,
      /.*creds.*/i,
      /.*secret.*/i
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
   * Argument patterns for detecting credentials in command-line arguments
   */
  private static readonly ARGUMENT_PATTERNS = {
    high: [
      // API key arguments
      /--api-key/i,
      /--apikey/i,
      /--key/i,

      // Token arguments
      /--token/i,
      /--access-token/i,
      /--auth-token/i,
      /--bearer-token/i,

      // Password arguments
      /--password/i,
      /--passwd/i,
      /--pwd/i,

      // Secret arguments
      /--secret/i,
      /--client-secret/i,

      // Authentication arguments
      /--auth/i,
      /--authorization/i,
      /--credentials/i,
      /--creds/i
    ],
    low: [
      // Organization and account IDs
      /--org-id/i,
      /--organization-id/i,
      /--account-id/i,
      /--user-id/i
    ]
  }

  /**
   * Header patterns for detecting credentials in HTTP headers
   */
  private static readonly HEADER_PATTERNS = {
    high: [
      // Authorization headers
      /authorization/i,
      /auth/i,

      // API key headers
      /x-api-key/i,
      /api-key/i,
      /apikey/i,

      // Token headers
      /x-access-token/i,
      /access-token/i,
      /bearer-token/i,
      /x-auth-token/i,
      /auth-token/i,

      // Custom authentication headers
      /x-.*-key/i,
      /x-.*-token/i,
      /x-.*-secret/i,

      // Service-specific patterns
      /x-github-token/i,
      /x-openai-key/i,
      /x-anthropic-key/i
    ],
    low: [
      // User identification headers
      /x-user-id/i,
      /x-org-id/i,
      /x-organization-id/i,
      /x-account-id/i
    ]
  }

  /**
   * Variable substitution pattern to detect safe variable references
   */
  private static readonly VARIABLE_SUBSTITUTION_PATTERN = /^\$\{[^}]+\}$/

  /**
   * Check if a value is a variable substitution pattern (e.g., ${input:token})
   */
  static isVariableSubstitution (value: string): boolean {
    return this.VARIABLE_SUBSTITUTION_PATTERN.test(value)
  }

  /**
   * Analyze command-line arguments for potential credentials
   */
  static analyzeArguments (args: string[] | undefined): CredentialAnalysisResult {
    if (!args || !Array.isArray(args) || args.length === 0) {
      return {
        hasCredentials: false,
        credentialVars: [],
        riskLevel: 'none'
      }
    }

    const credentialVars: CredentialVariable[] = []

    // Check each argument and the next one for credential patterns
    for (let i = 0; i < args.length - 1; i++) {
      const arg = args[i]
      const nextArg = args[i + 1]

      // Check if current argument matches a credential flag pattern
      const isHighRiskArg = this.ARGUMENT_PATTERNS.high.some(pattern => pattern.test(arg))
      const isLowRiskArg = this.ARGUMENT_PATTERNS.low.some(pattern => pattern.test(arg))

      if (isHighRiskArg || isLowRiskArg) {
        // The next argument should be the value
        if (nextArg && !nextArg.startsWith('-')) {
          credentialVars.push({
            name: arg,
            value: this.maskValue(nextArg),
            riskLevel: isHighRiskArg ? 'high' : 'low',
            source: 'args'
          })
          i++ // Skip the next argument since we've processed it as a value
        }
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
   * Analyze HTTP headers for potential credentials
   */
  static analyzeHeaders (headers: Record<string, string> | undefined): CredentialAnalysisResult {
    if (!headers || typeof headers !== 'object') {
      return {
        hasCredentials: false,
        credentialVars: [],
        riskLevel: 'none'
      }
    }

    const credentialVars: CredentialVariable[] = []

    for (const [name, value] of Object.entries(headers)) {
      // Skip variable substitution patterns (they're safe)
      if (this.isVariableSubstitution(value)) {
        continue
      }

      const isHighRiskHeader = this.HEADER_PATTERNS.high.some(pattern => pattern.test(name))
      const isLowRiskHeader = this.HEADER_PATTERNS.low.some(pattern => pattern.test(name))

      if (isHighRiskHeader || isLowRiskHeader) {
        credentialVars.push({
          name,
          value: this.maskValue(value),
          riskLevel: isHighRiskHeader ? 'high' : 'low',
          source: 'headers'
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
   * Comprehensive analysis of server configuration for credentials
   */
  static analyzeServerConfig (config: {
    env?: Record<string, string>
    args?: string[]
    headers?: Record<string, string>
  }): CredentialAnalysisResult {
    const envResult = this.analyzeEnvironmentVariables(config.env)
    const argsResult = this.analyzeArguments(config.args)
    const headersResult = this.analyzeHeaders(config.headers)

    // Combine all credential variables
    const allCredentialVars = [
      ...envResult.credentialVars,
      ...argsResult.credentialVars,
      ...headersResult.credentialVars
    ]

    const hasCredentials = allCredentialVars.length > 0
    const riskLevel = this.calculateOverallRiskLevel(allCredentialVars)

    return {
      hasCredentials,
      credentialVars: allCredentialVars,
      riskLevel
    }
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
      // Skip variable substitution patterns (they're safe)
      if (this.isVariableSubstitution(value)) {
        continue
      }

      if (this.isPotentialCredential(name)) {
        credentialVars.push({
          name,
          value: this.maskValue(value),
          riskLevel: this.assessRiskLevel(name),
          source: 'env'
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
  source?: 'env' | 'args' | 'headers'
}

export interface CredentialAnalysisResult {
  hasCredentials: boolean
  credentialVars: CredentialVariable[]
  riskLevel: 'none' | 'low' | 'high'
}
