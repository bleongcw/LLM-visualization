import type { DisplayToken } from "./types"

export function tokenizeForDisplay({
  prompt,
  generated,
}: {
  prompt: string
  generated: string
}): DisplayToken[] {
  let nextSyntheticId = 1000
  const promptTokens = splitText(prompt).map((text) =>
    makeToken(text, "prompt", nextSyntheticId++),
  )
  const generatedTokens = splitText(generated).map((text) =>
    makeToken(text, "generated", nextSyntheticId++),
  )

  return [
    makeToken("<|im_start|>", "special", 0),
    makeToken("user", "special", 0),
    ...promptTokens,
    makeToken("<|im_end|>", "special", 0),
    makeToken("<|im_start|>", "special", 0),
    makeToken("assistant", "special", 0),
    ...generatedTokens,
  ]
}

export function countDisplayTokens(text: string) {
  return splitText(text).length
}

function splitText(text: string) {
  const matches = text.match(/\s+\S+|\S+|\s+/g) ?? []
  return matches
    .map((match) => match.replace(/\n/g, "\\n").replace(/^ /, "_"))
    .filter((match) => match.length > 0)
}

function makeToken(
  text: string,
  kind: DisplayToken["kind"],
  syntheticId: number,
): DisplayToken {
  const stableHash = Array.from(text).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  )
  return {
    id: kind === "special" ? stableHash : syntheticId,
    text,
    kind,
  }
}
