export type HealthStatus = {
  ok: boolean
  ollamaReachable: boolean
  modelInstalled: boolean
  model: string
  version?: string
  message: string
}

export type TopLogprob = {
  token: string
  logprob: number
  probability: number
  bytes?: number[]
}

export type NextTokenRequest = {
  prompt: string
  system?: string
  generated: string
  maxNewTokens: number
  generatedTokenCount: number
  contextLimit: number
}

export type NextTokenResponse = {
  token: string
  tokenId?: number
  topCandidates: TopLogprob[]
  promptEvalCount: number
  evalCount: number
  contextCount: number
  done: boolean
  doneReason?: string
  stopReason?: "max_tokens" | "context_window" | "stop_token" | "ollama_done"
}

export type TokenDistributionRequest = {
  prompt: string
  system?: string
  generated?: string
  maxCandidates?: number
  contextLimit?: number
}

export type TokenDistributionResponse = {
  topCandidates: TopLogprob[]
  promptEvalCount: number
  evalCount: number
  contextCount: number
}
