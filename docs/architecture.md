# Architecture

## Shape

The app has three layers:

- Browser UI: Vite, React, TypeScript, Tailwind, and shadcn/ui components.
- Visualization registry: each concept demo is a self-contained module.
- Local API proxy: an Express server that talks to Ollama.

```text
Browser UI
  -> Vite proxy /api/*
    -> Express API on 127.0.0.1:8787
      -> Ollama on 127.0.0.1:11434
```

## Visualization Modules

Every visualization should export a React component and be registered in `src/visualizations/index.ts`.

The shared `VisualizationDefinition` includes:

- `id`
- `title`
- `heading`
- `path`
- `description`
- `modelBadge`
- `instructions`
- `examples`
- `capabilities`
- `component`

This keeps routing, navigation, docs, and capability checks separate from each visualization's internal state.

Current modules:

- `src/visualizations/autoregressive-loop`: greedy one-token-at-a-time generation.
- `src/visualizations/selecting-next-token`: sampling controls and repeated trial visualization.

The app header renders clickable buttons from the registry, so adding a registry entry is enough to expose a new visualization in navigation.

## Shared Shell

`VisualizationShell` provides:

- title and description from `VisualizationDefinition`
- model badge
- Ollama health check
- `Instructions` drawer
- local setup warning when Ollama or the model is missing

Individual visualizations own their internal tutorial dialogs, panels, and interaction state.

## Provider Adapter

Ollama-specific browser calls live in `src/lib/ollama/*`.

Server-side Ollama calls live in `server/ollama.ts`. Visualizations should not call `http://127.0.0.1:11434` directly from React components. Use the local app API instead.

The current local API exposes:

- `GET /api/health`
- `POST /api/next-token`
- `POST /api/token-distribution`

### `GET /api/health`

Checks Ollama version, installed models, and whether `qwen3:0.6b` is available.

### `POST /api/next-token`

Used by Auto Regression Loop.

Request shape:

```ts
{
  prompt: string
  system?: string
  generated: string
  maxNewTokens: number
  generatedTokenCount: number
  contextLimit: number
}
```

Returns the selected token, top candidates, context count, and stop reason.

### `POST /api/token-distribution`

Used by Selecting Next Token.

Request shape:

```ts
{
  prompt: string
  system?: string
  maxCandidates?: number
  contextLimit?: number
}
```

Returns top candidate tokens with `token`, `logprob`, `probability`, and optional byte data. Ollama currently caps `top_logprobs` at `20`, so the server clamps `maxCandidates` to that value.

## Sampling Model

The Selecting Next Token visualization uses real Ollama `top_logprobs` as its candidate set, then performs teaching-oriented sampling math in the browser:

1. Apply temperature over candidate logprobs.
2. Select candidates with Top-K or Top-P.
3. Renormalize the selected candidates into sampling weights.
4. Run repeated client-side random draws from those weights.

This keeps the interaction fast and makes trial frequency deterministic enough to test at the utility level, while still starting from live model probabilities.

## Extension Points

Future visualizations can reuse:

- `VisualizationShell` for status checks and instructions.
- shadcn/ui primitives under `src/components/ui`.
- provider adapters under `src/lib`.
- token display helpers under `src/lib/tokenization`.

If a visualization needs a new provider, add a small adapter rather than wiring provider-specific fetch calls into the component.

## Testing Strategy

- Use `npm run typecheck` for TypeScript.
- Use `npm run lint` for static code quality.
- Use `npm run test` for fast unit tests. Current tests cover the sampling utilities.
- Use `npm run build` before publishing or pushing meaningful UI changes.
- For model-backed behavior, use `./scripts/check-ollama.sh` and smoke test the relevant endpoint.
