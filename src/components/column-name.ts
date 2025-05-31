import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text.toUpperCase()
  const data = styleText(['dim'], formattedText)

  return data
}
