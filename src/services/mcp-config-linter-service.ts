import fs from 'node:fs/promises'

export class MCPConfigLinterService {
  private filePath: string
  private fileContents: string | null = null

  constructor (filePath: string) {
    this.filePath = filePath
  }

  async isValidSyntax (): Promise<boolean> {
    // @TODO this should also support YAML files and other formats
    try {
      const fileContent = await this.getFileContent()
      JSON.parse(fileContent)
      return true
    } catch (error) {
      return false
    }
  }

  async countMCPServers (): Promise<number> {
    const mcpServers = await this.getMCPServers()
    return Object.keys(mcpServers).length
  }

  async getMCPServers (): Promise<Record<string, object>> {
    const fileContentRaw = await this.getFileContent()

    // @TODO parse this file that may have comments inside it
    // can use comment-json npm package or similar
    const fileContentsData = JSON.parse(fileContentRaw)

    // VS Code uses `servers`
    if (fileContentsData?.servers) {
      return fileContentsData.servers
    }

    // VS Code global settings.json file uses `mcp` -> `servers`
    if (fileContentsData?.mcp?.servers) {
      return fileContentsData.mcp.servers
    }

    // Claude and Cursor use the `mcpServers` key
    if (fileContentsData?.mcpServers) {
      return fileContentsData.mcpServers
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
