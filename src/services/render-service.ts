import TransportComponent from '../components/transport.js'
import ColumnNameComponent from '../components/column-name.js'
import MCPServerStatusComponent from '../components/mcp-server-status.js'
import MCPServerNameComponent from '../components/mcp-server-name.js'
import { get } from 'http'

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

    // const headers = ['STATUS', 'NAME', 'TRANSPORT', 'VERSION', 'TOOLS', 'RESOURCES']
    // const keys = ['status', 'name', 'transport', 'version', 'tools', 'resources']
    const headers = ['STATUS', 'NAME', 'TRANSPORT']
    const keys = ['status', 'name', 'transport']
    const centerColumns = [0, 2, 4, 5] // STATUS, TOOLS, RESOURCES column indices
    const leftPadding = '      ' // 6 characters

    // Calculate column widths
    const columnWidths = headers.map((header, index) => {
      const dataWidth = Math.max(...data.map(row => String(row[keys[index]]).length))
      return Math.max(header.length, dataWidth)
    })

    // Helper function to center text in a given width
    const centerText = (text: string, width: number): string => {
      // Calculate visible length by removing ANSI escape codes
      const padding = width - this.getVisibleLength(text)
      const leftPad = Math.floor(padding / 2)
      const rightPad = padding - leftPad
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
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
      // Calculate visible length by removing ANSI escape codes
      const padding = columnWidths[index] - this.getVisibleLength(headerText)
      return headerText + ' '.repeat(Math.max(0, padding))
    }).join('  ')
    console.log(leftPadding + headerRow)

    // Print bottom separator
    console.log(leftPadding + separator)

    // Print data rows
    for (const row of data) {
      const dataRow = keys.map((key, index) => {
        let text = String(row[key])
        if (key === 'transport') {
          text = TransportComponent(text)
        }

        if (key === 'status') {
          text = MCPServerStatusComponent(text)
        }

        if (key === 'name') {
          text = MCPServerNameComponent(text)
        }

        if (centerColumns.includes(index)) {
          return centerText(text, columnWidths[index])
        }
        return text.padEnd(columnWidths[index])
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

  static printMcpGroup (id: number, data: any[]) {
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

    // Calculate column widths
    const columnWidths = headers.map((header, index) => {
      const dataWidth = Math.max(...data.map(row => {
        const columnText = ColumnNameComponent(row[keys[index]])
        const columnTextLength = this.getVisibleLength(columnText)
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
        } else {
          return String(row[key]).padEnd(columnWidths[index] + paddingNormalizer)
        }
      }).join('  ')
      const leftPadding = index === 0 ? leftPaddingGroupLead : leftPaddingGroupData
      console.log(leftPadding + dataRow)
    }

    // Print bottom separator
    // console.log('')
  }
}
