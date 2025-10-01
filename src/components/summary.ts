import { styleText } from 'node:util'

interface SummaryStats {
  totalServers: number
  runningServers: number
  highRiskCredentials: number
  implicitLatestVersions: number
  transportBreakdown: {
    stdio: number
    sse: number
    http: number
  }
}

export default function SummaryComponent (stats: SummaryStats): string {
  const { totalServers, runningServers, highRiskCredentials, implicitLatestVersions, transportBreakdown } = stats

  // Create progress bars (20 characters wide, following existing convention)
  const runningBar = createProgressBar(runningServers, totalServers, 20, 'green', false)
  const securityBar = createProgressBar(highRiskCredentials, totalServers, 20, 'red', true)
  const versionBar = createProgressBar(implicitLatestVersions, totalServers, 20, 'red', true)

  // Format transport breakdown
  const transportText = `stdio: ${transportBreakdown.stdio} | SSE: ${transportBreakdown.sse} | HTTP: ${transportBreakdown.http}`

  // Build the summary output
  const lines = [
    'SUMMARY',
    `      SERVERS     ${runningBar} ${runningServers} / ${totalServers} Running`,
    `      SECURITY    ${securityBar} ${highRiskCredentials} / ${totalServers} High Risk Credentials`,
    `      VERSION     ${versionBar} ${implicitLatestVersions} / ${totalServers} Implicit Latest`,
    `      TRANSPORT   ${transportText}`
  ]

  return lines.join('\n')
}

function createProgressBar (count: number, total: number, width: number, color: 'green' | 'red', emptyIsGood: boolean = false): string {
  if (total === 0) {
    const emptyBar = '░'.repeat(width)
    return emptyBar
  }

  const progress = Math.min(count / total, 1)
  const filledWidth = Math.round(progress * width)
  const emptyWidth = width - filledWidth

  let filled: string
  let empty: string

  if (color === 'green') {
    filled = styleText(['greenBright'], '█'.repeat(filledWidth))
    empty = styleText(['green'], '░'.repeat(emptyWidth))
  } else { // red
    filled = styleText(['redBright'], '█'.repeat(filledWidth))
    // If count is 0 and emptyIsGood is true, use green for empty sections (0 issues is good)
    if (count === 0 && emptyIsGood) {
      empty = styleText(['green'], '░'.repeat(emptyWidth))
    } else {
      empty = styleText(['red'], '░'.repeat(emptyWidth))
    }
  }

  return `${filled}${empty}`
}
