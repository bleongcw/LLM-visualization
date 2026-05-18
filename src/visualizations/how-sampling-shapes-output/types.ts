import type { TopLogprob } from "@/lib/ollama/types"

import type { CandidateToken, SamplingMode } from "@/visualizations/selecting-next-token/types"

export type ExplorationStep = {
  rawCandidates: TopLogprob[]
  selected?: CandidateToken
}

export type CompletionToken = {
  token: string
  probability: number
  weight: number
}

export type CompletionRun = {
  id: number
  tokens: CompletionToken[]
}

export type SamplingSettings = {
  temperature: number
  mode: SamplingMode
  topK: number
  topP: number
}

