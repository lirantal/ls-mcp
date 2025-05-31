import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text.toUpperCase()
  let data = ''
  if (formattedText === 'STDIO') {
    data = styleText(['magenta'], formattedText)
  }

  if (formattedText === 'SSE') {
    data = styleText(['blue'], formattedText)
  }

  return data
}
