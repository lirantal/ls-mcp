import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text.toUpperCase()

  if (formattedText === 'LOCAL') {
    return styleText(['gray'], formattedText)
  }

  if (formattedText === 'REMOTE') {
    return styleText(['blue'], formattedText)
  }

  return formattedText
}
