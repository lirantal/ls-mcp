import { styleText } from 'node:util'

export class FormatterService {
  filePathToTerminal (filePath: string): string {
    return styleText(['underline'], filePath)
  }
}
