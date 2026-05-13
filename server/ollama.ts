const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"
const MODEL = process.env.OLLAMA_MODEL ?? "qwen3:0.6b"

type OllamaTagsResponse = {
  models?: Array<{ name: string; model?: string }>
}

type OllamaGenerateResponse = {
  response?: string
  done?: boolean
  done_reason?: string
  prompt_eval_count?: number
  eval_count?: number
  logprobs?: OllamaLogprob[]
}

type OllamaLogprob = {
  token?: string
  logprob?: number
  bytes?: number[]
  top_logprobs?: OllamaCandidateLogprob[]
}

type OllamaCandidateLogprob = {
  token?: string
  logprob?: number
  bytes?: number[]
}

export async function getOllamaHealth() {
  try {
    const [versionResponse, tagsResponse] = await Promise.all([
      fetch(`${OLLAMA_BASE_URL}/api/version`),
      fetch(`${OLLAMA_BASE_URL}/api/tags`),
    ])

    if (!versionResponse.ok || !tagsResponse.ok) {
      return {
        ok: false,
        ollamaReachable: false,
        modelInstalled: false,
        model: MODEL,
        message: "Ollama responded unexpectedly. Restart Ollama and try again.",
      }
    }

    const version = (await versionResponse.json()) as { version?: string }
    const tags = (await tagsResponse.json()) as OllamaTagsResponse
    const modelInstalled =
      tags.models?.some((model) => model.name === MODEL || model.model === MODEL) ??
      false

    return {
      ok: modelInstalled,
      ollamaReachable: true,
      modelInstalled,
      model: MODEL,
      version: version.version,
      message: modelInstalled
        ? `Ollama is ready with ${MODEL}.`
        : `Ollama is running, but ${MODEL} is not installed. Run: ollama pull ${MODEL}`,
    }
  } catch {
    return {
      ok: false,
      ollamaReachable: false,
      modelInstalled: false,
      model: MODEL,
      message:
        "Ollama is not reachable at http://127.0.0.1:11434. Run: ollama serve",
    }
  }
}

export async function generateNextToken({
  prompt,
  system,
  generated,
  maxNewTokens,
  generatedTokenCount,
  contextLimit,
}: {
  prompt: string
  system?: string
  generated: string
  maxNewTokens: number
  generatedTokenCount: number
  contextLimit: number
}) {
  if (generatedTokenCount >= maxNewTokens) {
    return {
      token: "",
      topCandidates: [],
      promptEvalCount: 0,
      evalCount: 0,
      contextCount: generatedTokenCount,
      done: true,
      stopReason: "max_tokens" as const,
    }
  }

  const generationPrompt = buildPrompt(prompt, generated)
  const body = {
    model: MODEL,
    prompt: generationPrompt,
    system,
    stream: false,
    think: false,
    logprobs: true,
    top_logprobs: 20,
    options: {
      num_predict: 1,
      temperature: 0,
      num_ctx: contextLimit,
      logprobs: true,
      top_logprobs: 20,
      stop: ["<|im_end|>", "<|im_start|>"],
    },
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Ollama returned ${response.status}`)
  }

  const json = (await response.json()) as OllamaGenerateResponse
  const tokenInfo = json.logprobs?.[0]
  const token = tokenInfo?.token ?? json.response ?? ""
  const topCandidates = normalizeTopLogprobs(tokenInfo, token)
  const contextCount = json.prompt_eval_count ?? estimateTokenCount(generationPrompt)
  const stopReason = getStopReason({
    token,
    done: Boolean(json.done),
    doneReason: json.done_reason,
    generatedTokenCount,
    maxNewTokens,
    contextCount,
    contextLimit,
  })

  return {
    token,
    tokenId: syntheticTokenId(token),
    topCandidates,
    promptEvalCount: json.prompt_eval_count ?? contextCount,
    evalCount: json.eval_count ?? 1,
    contextCount,
    done: Boolean(stopReason),
    doneReason: json.done_reason,
    stopReason,
  }
}

function buildPrompt(prompt: string, generated: string) {
  return `${prompt}\n\nAssistant:${generated}`
}

function normalizeTopLogprobs(tokenInfo: OllamaLogprob | undefined, fallbackToken: string) {
  const candidates = tokenInfo?.top_logprobs?.length
    ? tokenInfo.top_logprobs
    : [{ token: fallbackToken, logprob: tokenInfo?.logprob ?? 0, bytes: tokenInfo?.bytes }]

  return candidates
    .filter((candidate) => candidate.token)
    .slice(0, 20)
    .map((candidate) => ({
      token: candidate.token ?? "",
      logprob: candidate.logprob ?? 0,
      probability: Math.exp(candidate.logprob ?? 0),
      bytes: candidate.bytes,
    }))
}

function getStopReason({
  token,
  done,
  doneReason,
  generatedTokenCount,
  maxNewTokens,
  contextCount,
  contextLimit,
}: {
  token: string
  done: boolean
  doneReason?: string
  generatedTokenCount: number
  maxNewTokens: number
  contextCount: number
  contextLimit: number
}) {
  if (generatedTokenCount + 1 >= maxNewTokens) return "max_tokens" as const
  if (contextCount >= contextLimit) return "context_window" as const
  if (token.includes("<|im_end|>")) return "stop_token" as const
  if (done && doneReason === "stop") return "ollama_done" as const
  return undefined
}

function estimateTokenCount(text: string) {
  return Math.max(1, text.trim().split(/\s+/).length)
}

function syntheticTokenId(token: string) {
  return Array.from(token).reduce((total, char) => total + char.charCodeAt(0), 0)
}
