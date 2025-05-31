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
    const fileContentsData = JSON.parse(fileContentRaw)

    const mcpServers = fileContentsData?.mcpServers

    return mcpServers
  }

  async getFileContent (): Promise<string> {
    if (this.fileContents) {
      return this.fileContents
    }
    this.fileContents = await fs.readFile(this.filePath, 'utf-8')
    return this.fileContents
  }
}
