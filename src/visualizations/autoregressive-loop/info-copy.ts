export const infoCopy = {
  input:
    "Your input prompt is broken up into tokens by the model's tokenizer. Tokens can be complete words or parts of words, and often include a leading whitespace. As each iteration completes, the selected token is appended to the input context.",
  compute:
    "The output of one forward pass is a distribution over possible next tokens. This panel shows the top candidates returned by Ollama log probabilities.",
  select:
    "This visualization uses greedy decoding, so it always selects the highest-probability candidate. Later visualizations can add temperature, top-p, and sampling comparisons.",
  stop:
    "Stopping is controlled by the loop around the model. The loop ends when max new tokens are reached, the context window is full, or a stop token is produced.",
}

export const tutorialSteps = [
  {
    title: "Welcome to the autoregressive loop",
    body: "Large language models do not write a sentence in one shot. They generate text one token at a time, append each token to the context, and ask again: given everything so far, what token is most likely next?",
  },
  {
    title: "Prompt panel",
    body: "Everything starts here. Type a prompt, set optional system behavior, or load one of the preset prompts.",
  },
  {
    title: "Playback buttons",
    body: "Use Step to progress manually through the loop, or Play to watch the stages advance automatically.",
  },
  {
    title: "Response box",
    body: "The generated response appears here as each selected token is appended.",
  },
  {
    title: "Information buttons",
    body: "Click the information buttons in each panel for a short explanation of the current stage.",
  },
]
