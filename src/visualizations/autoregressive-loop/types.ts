import type { TopLogprob } from "@/lib/ollama/types"

export type LoopPhase = "input" | "compute" | "select" | "stop"

export type GenerationStep = {
  token: string
  tokenId?: number
  candidates: TopLogprob[]
  contextCount: number
  stopReason?: string
}
