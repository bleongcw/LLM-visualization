import { AutoregressiveLoop } from "@/visualizations/autoregressive-loop/autoregressive-loop"

import type { VisualizationDefinition } from "./types"

export const visualizations: VisualizationDefinition[] = [
  {
    id: "autoregressive-loop",
    title: "Autoregressive Loop",
    path: "/autoregressive-loop",
    description:
      "Watch a local LLM generate one token at a time by repeatedly scoring, selecting, and appending the next token.",
    modelBadge: "qwen3:0.6b",
    instructions: [
      "Large language models generate text one token at a time. Each loop sends the current context to the model, asks what token should come next, and appends the selected token.",
      "Use Step to walk through the four stages manually: input tokens, compute probabilities, select token, then stop or continue.",
      "Use Play to run the same loop automatically. Lower Max New Tokens to force an early stop and see the stopping condition fire.",
    ],
    examples: [
      {
        id: "bayesian",
        label: "Bayesian reasoning",
        prompt: "Can you explain what Bayesian reasoning is?",
        system:
          "You are a clear tutor. Answer in two concise paragraphs and avoid hidden reasoning traces.",
      },
      {
        id: "sentiment",
        label: "Sentiment analysis",
        prompt:
          "Classify this review as positive, neutral, or negative: The headphones fit well, but the battery barely lasts half a day.",
        system:
          "You are a terse classifier. Answer with the label first, then one sentence of explanation.",
      },
      {
        id: "debugging",
        label: "Debugging",
        prompt:
          "A JavaScript function returns undefined when I expect an array. What are the first three things I should check?",
        system:
          "You are a pragmatic debugging assistant. Keep the answer short and concrete.",
      },
    ],
    capabilities: [
      {
        provider: "ollama",
        model: "qwen3:0.6b",
        features: ["generate", "logprobs", "top_logprobs"],
      },
    ],
    component: AutoregressiveLoop,
  },
]
