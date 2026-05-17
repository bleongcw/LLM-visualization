# LLM Visualization

Interactive browser visualizations for LLM concepts, powered by local Ollama. The app currently uses `qwen3:0.6b` to show how transformer-style language models generate and sample tokens.

## Visualizations

### Auto Regression Loop

Shows the four-step loop behind text generation:

1. Input tokens are sent into the model.
2. The model computes probabilities for the next token.
3. Greedy decoding selects the highest-probability token.
4. The loop decides whether to stop or append the token and continue.

### Selecting Next Token

Shows how sampling changes model output:

1. Generate candidate next-token probabilities from Ollama.
2. Reshape the distribution with temperature.
3. Filter candidates with Top-K or Top-P.
4. Run repeated trials and compare expected sampling weights with observed frequencies.

The project is designed for expansion. New visualizations live under `src/visualizations/*` and register themselves through `src/visualizations/index.ts`.

## Prerequisites

- Node.js 20+
- npm
- Ollama
- The local model:

```bash
ollama pull qwen3:0.6b
```

You can verify the local model setup with:

```bash
./scripts/check-ollama.sh
```

## Run Locally

Start Ollama:

```bash
ollama serve
```

Install dependencies and run the app:

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

The Vite app proxies `/api/*` requests to a local Express server on `127.0.0.1:8787`, which talks to Ollama on `127.0.0.1:11434`.

## How To Use The App

Use the tabs in the top-right app header to switch visualizations.

For **Auto Regression Loop**:

1. Choose a preset prompt or type your own.
2. Click `Step` to move through input tokens, probability computation, token selection, and stop/continue.
3. Click `Play` to run the loop automatically.
4. Change `Max New Tokens` or `Max Context Window` to see stopping conditions.

For **Selecting Next Token**:

1. Choose a preset prompt or type your own.
2. Click `Generate` to ask Ollama for next-token candidates.
3. Adjust `Temperature`, `Top-K`, or `Top-P`.
4. Switch between `Histogram` and `Wheel`.
5. Set `Number of Trials`, then click `Run Trials`.
6. Compare `Weight` with `Frequency` to see sampling randomness.

Open `Instructions` inside the app for guided exercises. More detailed usage notes live in [docs/usage.md](docs/usage.md).

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Local API

- `GET /api/health`: checks Ollama and the configured model.
- `POST /api/next-token`: returns one greedy next token for the autoregressive loop.
- `POST /api/token-distribution`: returns top candidate tokens for sampling.

Ollama currently caps `top_logprobs` at `20` in this project, so the sampling visualization works over the visible candidate set returned by Ollama.

## Repository Guides

- [Usage Guide](docs/usage.md)
- [Architecture](docs/architecture.md)
- [Add a Visualization](docs/add-a-visualization.md)
- [shadcn MCP Setup](docs/shadcn-mcp.md)
- [Engineering Principles](docs/engineering-principles.md)

## Status

This is a local-first teaching app. It does not send prompts to a hosted backend.
