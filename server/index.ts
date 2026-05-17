import cors from "cors"
import express from "express"

import {
  generateNextToken,
  getOllamaHealth,
  getTokenDistribution,
} from "./ollama.js"

const app = express()
const port = Number(process.env.API_PORT ?? 8787)

app.use(cors())
app.use(express.json({ limit: "1mb" }))

app.get("/api/health", async (_request, response) => {
  response.json(await getOllamaHealth())
})

app.post("/api/next-token", async (request, response) => {
  try {
    const payload = request.body as {
      prompt?: string
      system?: string
      generated?: string
      maxNewTokens?: number
      generatedTokenCount?: number
      contextLimit?: number
    }

    if (!payload.prompt?.trim()) {
      response.status(400).send("Prompt is required.")
      return
    }

    response.json(
      await generateNextToken({
        prompt: payload.prompt,
        system: payload.system,
        generated: payload.generated ?? "",
        maxNewTokens: payload.maxNewTokens ?? 128,
        generatedTokenCount: payload.generatedTokenCount ?? 0,
        contextLimit: payload.contextLimit ?? 2048,
      }),
    )
  } catch (error) {
    response
      .status(502)
      .send(error instanceof Error ? error.message : "Ollama request failed.")
  }
})

app.post("/api/token-distribution", async (request, response) => {
  try {
    const payload = request.body as {
      prompt?: string
      system?: string
      maxCandidates?: number
      contextLimit?: number
    }

    if (!payload.prompt?.trim()) {
      response.status(400).send("Prompt is required.")
      return
    }

    response.json(
      await getTokenDistribution({
        prompt: payload.prompt,
        system: payload.system,
        maxCandidates: payload.maxCandidates ?? 20,
        contextLimit: payload.contextLimit ?? 2048,
      }),
    )
  } catch (error) {
    response
      .status(502)
      .send(
        error instanceof Error
          ? error.message
          : "Ollama distribution request failed.",
      )
  }
})

app.listen(port, "127.0.0.1", () => {
  console.log(`LLM visualization API listening on http://127.0.0.1:${port}`)
})
