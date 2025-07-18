import fs from 'node:fs/promises'
import { parse } from 'jsonc-parser'

export class MCPConfigLinterService {
  private filePath: string
  private fileContents: string | null = null
  private parsed: boolean = false
  private valid: boolean = false
  private fileContentsData: any | null = null

  constructor (filePath: string) {
    this.filePath = filePath
  }

  async parseFile (): Promise<void> {
    if (this.parsed) {
      return
    }
    this.parsed = true

    const fileContent = await this.getFileContent()

    // @TODO this should also support YAML files and other formats
    try {
      this.fileContentsData = JSON.parse(fileContent)
      if (typeof this.fileContentsData === 'object') {
        this.valid = true
        return
      }
    } catch (e) {
      // ignore
    }

    try {
      this.fileContentsData = parse(fileContent)
      if (typeof this.fileContentsData === 'object') {
        this.valid = true
      }
    } catch (error) {
      // ignore
    }
  }

  async isValidSyntax (): Promise<boolean> {
    try {
      await this.parseFile()
      return this.valid
    } catch (error) {
      return false
    }
  }

  async countMCPServers (): Promise<number> {
    try {
      const mcpServers = await this.getMCPServers()
      return Object.keys(mcpServers).length
    } catch (error) {
      return 0
    }
  }

  async getMCPServers (): Promise<Record<string, object>> {
    await this.parseFile()

    // VS Code uses `servers`
    if (this.fileContentsData?.servers) {
      return this.fileContentsData.servers
    }

    // VS Code global settings.json file uses `mcp` -> `servers`
    if (this.fileContentsData?.mcp?.servers) {
      return this.fileContentsData.mcp.servers
    }

    // Claude and Cursor use the `mcpServers` key
    if (this.fileContentsData?.mcpServers) {
      return this.fileContentsData.mcpServers
    }

    // Zed uses `context_servers` key
    if (this.fileContentsData?.context_servers) {
      return this.fileContentsData.context_servers
    }

    return {}
  }

  async getFileContent (): Promise<string> {
    if (this.fileContents) {
      return this.fileContents
    }
    this.fileContents = await fs.readFile(this.filePath, 'utf-8')
    return this.fileContents
  }
}
