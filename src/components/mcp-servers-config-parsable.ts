import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text.toUpperCase().replace(/_/g, ' ')
  let data = formattedText
  if (formattedText === 'VALID') {
    data = styleText(['green'], '●')
  } else {
    data = styleText(['red'], '●')
  }

  return data
}
