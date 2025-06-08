import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = String(text).trim()

  return styleText(['gray'], formattedText)
}
