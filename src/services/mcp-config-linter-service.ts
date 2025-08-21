import { MCPConfigParser } from './mcp-config-parser.js'

export class MCPConfigLinterService {
  private parser: MCPConfigParser

  constructor (filePath: string) {
    this.parser = new MCPConfigParser(filePath)
  }

  async parseFile (): Promise<void> {
    // This method is kept for backward compatibility but now delegates to the parser
    await this.parser.parseConfigFile()
  }

  async isValidSyntax (): Promise<boolean> {
    return await this.parser.isValidSyntax()
  }

  async countMCPServers (): Promise<number> {
    return await this.parser.countMCPServers()
  }

  async getMCPServers (): Promise<Record<string, object>> {
    const configData = await this.parser.parseConfigFile()
    return configData.servers
  }

  async getFileContent (): Promise<string> {
    // This method is kept for backward compatibility but the parser handles file reading internally
    // We'll need to access the parser's internal file content
    const configData = await this.parser.parseConfigFile()
    return JSON.stringify(configData.raw, null, 2)
  }
}
