import { styleText } from 'node:util'

export class FormatterService {
  filePathToTerminal (filePath: string): string {
    const normalizedPath = encodeURI(filePath)
    return styleText(['underline'], `file://${normalizedPath}`)
  }
}
