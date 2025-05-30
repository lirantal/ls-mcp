import fs from 'node:fs/promises'

export class MCPLinterService {
  private filePath: string

  constructor (filePath: string) {
    this.filePath = filePath
  }

  async isValidSyntax (): Promise<boolean> {
    // @TODO this should also support YAML files and other formats
    try {
      const fileContent = await fs.readFile(this.filePath, 'utf-8')
      JSON.parse(fileContent)
      return true
    } catch (error) {
      return false
    }
  }
}
