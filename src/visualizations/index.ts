import { AutoregressiveLoop } from "@/visualizations/autoregressive-loop/autoregressive-loop"
import { ConstrainedGenerationFsm } from "@/visualizations/constrained-generation-fsm"
import { HowSamplingShapesOutput } from "@/visualizations/how-sampling-shapes-output"
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
  {
    id: "how-sampling-shapes-output",
    title: "How Sampling Shapes Output",
    heading: "1.3. How Sampling Shapes Output",
    path: "/how-sampling-shapes-output",
    description:
      "See how sampling parameters shape what the model generates next. Each time a token is chosen, a new set of candidate continuations appears with its own probability. Adjust the sampling parameters, then click tokens or generate multiple completions to compare the paths they open up.",
    modelBadge: "qwen3:0.6b",
    instructions: [
      "Token selection during autoregressive generation is a random event, so identical prompts can lead to different completions depending on which token is selected at each cycle.",
      "Use Choose Your Own Completion to generate candidate tokens, pick one, and observe how each choice changes the next column of candidates.",
      "Watch the cumulative path probability change as you select likely or unlikely tokens.",
      "Use Multiple Completions to generate several sampled continuations from the same prompt and compare where they match or diverge.",
      "Change temperature, Top-K, or Top-P to see how output variety and token confidence change.",
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
        features: [
          "chat",
          "logprobs",
          "top_logprobs",
          "sampling",
          "continuations",
        ],
      },
    ],
    component: HowSamplingShapesOutput,
  },
  {
    id: "constrained-generation-fsm",
    title: "Constrained Generation with Finite State Machines (FSM)",
    heading: "1.4. Constrained Generation with Finite State Machines (FSM)",
    path: "/constrained-generation-fsm",
    description:
      "See how constrained generation keeps a model's output inside a required JSON schema. At each step, the model proposes possible next tokens, and a finite state machine masks any token that would lead to an invalid state by setting its probability to zero. Step through the animation to watch the FSM advance character by character, compare original token probabilities with the masked distribution, then compare constrained output with unconstrained output.",
    instructions: [
      "Constrained generation is useful when the caller needs valid JSON, function-call arguments, classifications, or extracted fields instead of free-form text.",
      "Choose a prompt preset, then inspect the target schema. The schema defines which keys and value types the final response must contain.",
      "Use Step to advance one character at a time. The highlighted FSM state shows what kind of character is legal next.",
      "Compare the raw candidate tokens with the masked distribution. Invalid candidates are assigned probability zero, and valid candidates are renormalized.",
      "Compare the constrained output with the unconstrained output. The constrained side remains parseable JSON while the unconstrained side can drift into prose, markdown, or code.",
    ],
    examples: [
      {
        id: "function-call",
        label: "Function Call",
        prompt:
          "Find the area of a triangle with base 10 and height 5. Respond with a JSON function call.",
      },
      {
        id: "sentiment",
        label: "Sentiment",
        prompt: "Classify a product review as JSON.",
      },
      {
        id: "data-extraction",
        label: "Data Extraction",
        prompt: "Extract structured JSON fields from a sentence.",
      },
    ],
    capabilities: [
      {
        provider: "browser",
        features: ["fsm", "json-schema", "token-masking"],
      },
    ],
    component: ConstrainedGenerationFsm,
  },
]
