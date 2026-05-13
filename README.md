# LLM Visualization

Interactive browser visualizations for LLM concepts. The first module demonstrates the autoregressive loop using a local Ollama model, `qwen3:0.6b`, and real next-token log probabilities.

## What This Shows

The autoregressive loop visualization walks through four stages:

1. Input tokens are sent into the model.
2. The model computes a probability distribution for the next token.
3. Greedy decoding selects the highest-probability token.
4. The loop decides whether to stop or append the token and continue.

The project is designed for expansion. New visualizations live under `src/visualizations/*` and register themselves through `src/visualizations/index.ts`.

## Prerequisites

- Node.js 20+
- npm
- Ollama
- The local model:

```bash
ollama pull qwen3:0.6b
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

The Vite app proxies `/api/*` requests to a local Express server on `127.0.0.1:8787`, which then talks to Ollama on `127.0.0.1:11434`.

## Useful Commands

```bash
npm run typecheck
npm run lint
npm run build
```

## Repository Guides

- [Architecture](docs/architecture.md)
- [Add a Visualization](docs/add-a-visualization.md)
- [shadcn MCP Setup](docs/shadcn-mcp.md)
- [Engineering Principles](docs/engineering-principles.md)

## Status

This is a local-first teaching app. It does not send prompts to a hosted backend.
