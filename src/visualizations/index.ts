import { AutoregressiveLoop } from "@/visualizations/autoregressive-loop/autoregressive-loop"
import { SelectingNextToken } from "@/visualizations/selecting-next-token"

import type { VisualizationDefinition } from "./types"

export const visualizations: VisualizationDefinition[] = [
  {
    id: "autoregressive-loop",
    title: "Auto Regression Loop",
    heading: "1.1. The autoregressive loop",
    path: "/autoregressive-loop",
    description:
      "Watch a local LLM generate one token at a time by repeatedly scoring, selecting, and appending the next token. Choose an example prompt, or type your own, then step through the loop to see how each new token becomes part of the next input.",
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
  {
    id: "selecting-next-token",
    title: "Selecting Next Token",
    heading: "1.2. Selecting the next token",
    path: "/selecting-next-token",
    description:
      "See how the next token is sampled from the model output. At each step the model produces probabilities for candidate tokens, and the next token is drawn at random, weighted so more likely tokens are chosen more often. Adjust the sampling parameters to reshape the probability distribution and see how you sample from it.",
    modelBadge: "qwen3:0.6b",
    instructions: [
      "The output of each forward pass is a probability distribution across candidate tokens. The shape of that distribution, and how you sample from it, are settings you control.",
      "Explore temperature by generating a distribution, then moving the slider lower and higher. Lower values concentrate probability, while higher values spread probability across more tokens.",
      "Compare Top-K with Top-P. Top-K keeps a fixed number of candidates; Top-P keeps the smallest set of candidates whose cumulative probability crosses the selected threshold.",
      "Run repeated trials and compare the observed frequency column with the sampling weight column. The values should get closer as the number of trials grows.",
    ],
    examples: [
      {
        id: "coding",
        label: "Coding",
        prompt:
          "What are the allowed options for the cache_implementation parameter in transformers.GenerationConfig from hugging face?",
        system:
          "You answer technical questions with direct, concise wording and no hidden reasoning traces.",
      },
    ],
    capabilities: [
      {
        provider: "ollama",
        model: "qwen3:0.6b",
        features: ["chat", "logprobs", "top_logprobs", "sampling"],
      },
    ],
    component: SelectingNextToken,
  },
]
