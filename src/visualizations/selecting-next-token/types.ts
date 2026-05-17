import type { TopLogprob } from "@/lib/ollama/types"

export type SamplingMode = "top-k" | "top-p"

export type CandidateToken = TopLogprob & {
  id: string
  adjustedProbability: number
  weight: number
  selected: boolean
  frequency: number
}

export type TrialResult = {
  id: number
  token: CandidateToken
}

