import { clamp } from 'lodash'
export interface KarmaTarget {
  target: string
  amount: number
  isBuzzkill: boolean
  isTargetingSelf: boolean
}

export function getKarmaTarget(
  input: string,
  user: string
): KarmaTarget | null {
  // Tokenize by white-space, or by any quoted string, or by slack user mentions (which are followed by a space)
  const parts = input.match(
    /(?:\<\@\w+\>\s*|[^\s"]+|"(?:\\"|[^"])+")(?:\+*\-*)/g
  )
  if (!parts) return null

  for (let part of parts) {
    // First attempt to match slack users (<@asdf> format)
    let matches = part.match(/(\<\@\w+\>\s*)(\+{2,}|\-{2,})/)
    if (!matches) {
      // Attempt to match non-quoted-string possibility...
      matches = part.match(/([^\s"+-]+(?:[+-][^\s"+-]+)*)(\+{2,}|\-{2,})/)
      if (!matches) {
        // ...if that fails, attempt to match quoted-string possibility
        matches = part.match(/"([^"]+)"(\+{2,}|\-{2,})/)
        if (!matches) continue
      }
    }

    const [target, ops] = matches.slice(1)

    let amount = ops.length - 1
    if (ops.includes('-')) {
      amount = -amount
    }

    return {
      target: target.trim(),
      amount: clamp(amount, -4, 4),
      isBuzzkill: ops.length > 5,
      isTargetingSelf: target.trim() === `<@${user}>`
    }
  }

  return null
}
