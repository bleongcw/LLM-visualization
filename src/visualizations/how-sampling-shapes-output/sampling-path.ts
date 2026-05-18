import type { CandidateToken } from "@/visualizations/selecting-next-token/types"

import type { CompletionRun, CompletionToken } from "./types"

export function cumulativePathProbability(
  selections: Array<Pick<CandidateToken, "weight"> | undefined>,
) {
  const selected = selections.filter(Boolean) as Array<Pick<CandidateToken, "weight">>
  if (!selected.length) return 0
  return selected.reduce((product, token) => product * token.weight, 1)
}

export function tokenConfidenceBand(probability: number) {
  if (probability >= 0.7) return "high"
  if (probability >= 0.3) return "medium"
  return "low"
}

export function completionDivergence(
  reference: CompletionRun | undefined,
  run: CompletionRun,
) {
  if (!reference || reference.id === run.id) return "matches"

  const length = Math.min(reference.tokens.length, run.tokens.length)
  for (let index = 0; index < length; index += 1) {
    if (reference.tokens[index]?.token !== run.tokens[index]?.token) {
      return "diverges"
    }
  }

  return reference.tokens.length === run.tokens.length ? "matches" : "diverges"
}

export function appendCompletionToken(
  run: CompletionRun,
  token: CompletionToken,
): CompletionRun {
  return {
    ...run,
    tokens: [...run.tokens, token],
  }
}

export function displayPromptPreview(prompt: string, maxLength = 96) {
  const normalized = prompt.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 3)}...`
}

