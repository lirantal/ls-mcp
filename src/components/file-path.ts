import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text
  const data = styleText(['underline'], formattedText)

  return data
}
