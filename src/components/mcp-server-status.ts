import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text.toLowerCase()
  let data: string
  if (formattedText === 'running') {
    data = styleText(['green'], '●')
  } else {
    data = styleText(['red'], '●')
  }

  return data
}
