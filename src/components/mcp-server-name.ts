import { styleText } from 'node:util'

export default function render (text: string) {
  const formattedText = text.toLowerCase()

  const data = styleText(['bold', 'white'], formattedText)

  return data
}
