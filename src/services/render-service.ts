import { styleText } from 'node:util'
import TransportComponent from '../components/transport.js'
import ColumnNameComponent from '../components/column-name.js'
import MCPServerStatusComponent from '../components/mcp-server-status.js'
import MCPServerNameComponent from '../components/mcp-server-name.js'
import MCPServerSourceComponent from '../components/mcp-server-source.js'
import FilePathComponent from '../components/file-path.js'
import MCPServersConfigParsableComponent from '../components/mcp-servers-config-parsable.js'
import CredentialWarningComponent from '../components/credential-warning.js'

interface GroupMetadata {
  mcpServersRunning?: number
  mcpServersTotal?: number
}

export class RenderService {
  // Example mocked data for rendering the servers information
  // const mcpServersDataMock = [
  //   { status: '●', name: 'logging-server', type: 'SSE', version: '2.3.0', tools: '6', resources: '2' },
  //   { status: '●', name: 'git-logging-server', type: 'SSE', version: '2.3.0', tools: '6', resources: '2' },
  //   { status: '○', name: 'mcp-server', type: 'STDIO', version: '2.3.0', tools: '62', resources: '0' }
  // ]

  private static getVisibleLength (text: string): number {
    // Calculate visible length by removing ANSI escape codes
    return text.replace(/\u001b\[[0-9;]*m/g, '').length
  }

  static printMcpServers (data: any[]) {
    if (data.length === 0) return

    const headers = ['STATUS', 'NAME', 'SOURCE', 'TRANSPORT', 'CREDENTIALS']
    const keys = ['status', 'name', 'source', 'transport', 'credentials']
    const centerColumns = [0, 2, 3] // STATUS and TRANSPORT column indices
    const leftPadding = '      ' // 6 characters

    // Calculate column widths accounting for styled text
    const columnWidths = headers.map((header, index) => {
      const headerWidth = RenderService.getVisibleLength(ColumnNameComponent(header))
      const dataWidth = Math.max(...data.map(row => {
        let text = String(row[keys[index]])

        // Apply the same transformations used in rendering
        if (keys[index] === 'transport') {
          text = TransportComponent(text)
        }

        if (keys[index] === 'status') {
          text = MCPServerStatusComponent(text)
        }

        if (keys[index] === 'source') {
          text = MCPServerSourceComponent(text)
        }

        if (keys[index] === 'name') {
          text = MCPServerNameComponent(text)
        }

        if (keys[index] === 'credentials') {
          text = CredentialWarningComponent(row[keys[index]])
        }

        return RenderService.getVisibleLength(text)
      }))
      return Math.max(headerWidth, dataWidth)
    })

    // Helper function to center text in a given width
    const centerText = (text: string, width: number): string => {
      const visibleLength = RenderService.getVisibleLength(text)
      const padding = width - visibleLength
      const leftPad = Math.floor(padding / 2)
      const rightPad = padding - leftPad
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
    }

    // Helper function to pad text to the right
    const padRight = (text: string, width: number): string => {
      const visibleLength = RenderService.getVisibleLength(text)
      const padding = Math.max(0, width - visibleLength)
      return text + ' '.repeat(padding)
    }

    // Calculate total table width for separator line
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + (columnWidths.length - 1) * 2
    const separator = '─'.repeat(totalWidth)

    // Print top separator
    console.log('\n' + leftPadding + separator)

    // Print header
    const headerRow = headers.map((header, index) => {
      const headerText = ColumnNameComponent(header)
      if (centerColumns.includes(index)) {
        return centerText(headerText, columnWidths[index])
      }
      return padRight(headerText, columnWidths[index])
    }).join('  ')
    console.log(leftPadding + headerRow)

    // Print separator
    console.log(leftPadding + separator)

    // Print data rows
    for (const row of data) {
      const dataRow = keys.map((key, index) => {
        let text = String(row[key])

        // Apply styling transformations
        if (key === 'transport') {
          text = TransportComponent(text)
        }

        if (key === 'status') {
          text = MCPServerStatusComponent(text)
        }

        if (keys[index] === 'source') {
          text = MCPServerSourceComponent(text)
        }

        if (key === 'name') {
          text = MCPServerNameComponent(text)
        }

        if (key === 'credentials') {
          text = CredentialWarningComponent(row[key])
        }

        // Apply alignment
        if (centerColumns.includes(index)) {
          return centerText(text, columnWidths[index])
        }
        return padRight(text, columnWidths[index])
      }).join('  ')
      console.log(leftPadding + dataRow)
    }

    console.log('\n')
    console.log(`${leftPadding}▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄`)
  }

  // Example mocked data for rendering the group information
  // const mcpGroupDataMock = [
  //   { key: 'PROVIDER', value: 'Claude Desktop', },
  //   { key: 'FILE', value: '~/Library/Application Support/Claude/claude_desktop_config.json' },
  //   { key: 'STATUS', value: '[✓ VALID] [GLOBAL] [5 MCP SERVERS]' }
  // ]

  static printMcpGroup (id: number, data: any[], groupMetadata: GroupMetadata = {}) {
    if (data.length === 0) return

    console.log('\n')

    const headers = ['KEY', 'VALUE']
    const keys = ['key', 'value']

    // group left padding should include the indicator number
    // and then calculator for the remaining right padding.
    // left padding in total is 6 characters
    const indexText = `[${id}]`
    const leftPaddingGroupLead = indexText + ' '.repeat(6 - indexText.length)
    const leftPaddingGroupData = ' '.repeat(6)

    // Append group metadata keys to the data array
    if (Object.keys(groupMetadata).length > 0) {
      const runningCount = groupMetadata.mcpServersRunning || 0
      const totalCount = groupMetadata.mcpServersTotal || 0
      const metadataRow = RenderService.renderProgressBar(runningCount, totalCount, 'Running')
      data.push({ key: 'MCP SERVERS', value: metadataRow })
    }

    // Calculate column widths
    const columnWidths = headers.map((header, index) => {
      const dataWidth = Math.max(...data.map(row => {
        const columnText = ColumnNameComponent(row[keys[index]])
        const columnTextLength = RenderService.getVisibleLength(columnText)
        return columnTextLength
      }))
      return Math.max(header.length, dataWidth)
    })

    // Print data rows
    for (const [index, row] of data.entries()) {
      const dataRow = keys.map((key, index) => {
        const paddingNormalizer = ColumnNameComponent(row[key]).length - row[key].length
        if (key === 'key') {
          return ColumnNameComponent(row[key]).padEnd(columnWidths[index] + paddingNormalizer)
        }

        if (row['key'] === 'FILE') {
          return FilePathComponent(row[key]).padEnd(columnWidths[index] + paddingNormalizer)
        }

        if (row['key'] === 'PARSABLE') {
          return MCPServersConfigParsableComponent(row[key]).padEnd(columnWidths[index] + paddingNormalizer)
        }

        return String(row[key]).padEnd(columnWidths[index] + paddingNormalizer)
      }).join('  ')
      const leftPadding = index === 0 ? leftPaddingGroupLead : leftPaddingGroupData
      console.log(leftPadding + dataRow)
    }
  }

  // draws progress bar components like this
  // "███████░░░░░░░░░░░░░ 3 / 9 Running"
  static renderProgressBar (count: number, total: number, label: string, width: number = 20): string {
    if (total === 0) {
      const emptyBar = '░'.repeat(width)
      return `${emptyBar} 0 / 0 ${label}`
    }

    const progress = Math.min(count / total, 1)
    const filledWidth = Math.round(progress * width)
    const emptyWidth = width - filledWidth

    let filled: string
    let empty: string

    if (count > 0) {
      filled = styleText(['greenBright'], '█'.repeat(filledWidth))
      empty = styleText(['green'], '░'.repeat(emptyWidth))
    } else {
      filled = '█'.repeat(filledWidth)
      empty = '░'.repeat(emptyWidth)
    }

    return `${filled}${empty} ${count} / ${total} ${label}`
  }
}
