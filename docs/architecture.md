# Architecture

## Shape

The app has three layers:

- Browser UI: Vite, React, TypeScript, Tailwind, and shadcn/ui components.
- Visualization registry: each concept demo is a self-contained module.
- Local API proxy: an Express server that talks to Ollama.

```text
Browser UI
  -> Vite proxy /api/* for model-backed views
    -> Express API on 127.0.0.1:8787
      -> Ollama on 127.0.0.1:11434
  -> deterministic browser fixtures for stable teaching simulations
```

## Project Layout

```text
server/
  index.ts                 Express API routes
  ollama.ts                Ollama request/response adapter
src/
  components/layout/       app frame and visualization navigation
  components/ui/           local shadcn/ui primitives
  components/visualization-shell/
                            shared model status, instructions, and page copy
  lib/ollama/              browser API client and shared response types
  lib/tokenization/        lightweight token display helpers
  visualizations/          registry and visualization modules
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
- `src/visualizations/how-sampling-shapes-output`: token-path exploration and multiple sampled completions.
- `src/visualizations/constrained-generation-fsm`: deterministic FSM masking for schema-shaped JSON output.

The app header renders clickable buttons from the registry, so adding a registry entry is enough to expose a new visualization in navigation.

## Visualization Contract

Each visualization should be self-contained and export a React component. Shared app metadata lives in the registry, not inside the shell:

- `title` appears in the header tab.
- `heading` appears as the page heading.
- `description` appears in the intro panel.
- `instructions` powers the right-side instructions drawer.
- `capabilities` documents model/backend expectations.
- `component` points to the visualization entry component.

Keep visualization-specific tutorials, info dialogs, and panel state inside the visualization folder.

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

This boundary keeps the app easy to extend later. A future provider can add a small adapter and API route without forcing every visualization component to know provider-specific details.

The current local API exposes:

- `GET /api/health`
- `POST /api/next-token`
- `POST /api/token-distribution`

Fixture-driven visualizations, such as Constrained Generation with Finite State Machines (FSM), can stay entirely in the browser when they do not need live model data.

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

Used by Selecting Next Token and How Sampling Shapes Output.

Request shape:

```ts
{
  prompt: string
  system?: string
  generated?: string
  maxCandidates?: number
  contextLimit?: number
}
```

Returns top candidate tokens with `token`, `logprob`, `probability`, and optional byte data. The optional `generated` prefix lets follow-up visualizations request the next distribution after selected or sampled tokens. Ollama currently caps `top_logprobs` at `20`, so the server clamps `maxCandidates` to that value.

## Sampling Model

The Selecting Next Token and How Sampling Shapes Output visualizations use real Ollama `top_logprobs` as their candidate set, then perform teaching-oriented sampling math in the browser:

1. Apply temperature over candidate logprobs.
2. Select candidates with Top-K or Top-P.
3. Renormalize the selected candidates into sampling weights.
4. Run repeated client-side random draws from those weights.

This keeps the interaction fast and makes trial frequency deterministic enough to test at the utility level, while still starting from live model probabilities.

How Sampling Shapes Output adds two higher-level interactions on top of the same sampling utilities:

- a token explorer that sends the selected text back as `generated` context and fetches the next candidate column
- a multiple-completion panel that samples short continuations row by row from the same prompt and settings

## Constrained Generation With Finite State Machines (FSM)

The Constrained Generation with Finite State Machines (FSM) visualization is intentionally fixture-driven rather than model-driven. It demonstrates the mechanics of constrained decoding with a deterministic trace:

1. A target JSON output is split into character steps.
2. A small FSM scanner determines what state the decoder is in before each character.
3. A raw candidate distribution is generated for teaching purposes.
4. Invalid candidates are masked to zero based on the FSM state.
5. Valid candidates are renormalized.
6. The constrained output is compared with an unconstrained non-JSON response.

The pure FSM logic lives in:

```text
src/visualizations/constrained-generation-fsm/fsm-engine.ts
```

Fixtures live in:

```text
src/visualizations/constrained-generation-fsm/fsm-fixtures.ts
```

Tests cover masking, renormalization, state-specific token allowance, required field tracking, and fixture JSON validity.

## State And Reset Rules

Visualizations should reset derived model output when inputs change:

- Changing the prompt or system instruction should clear generated tokens, distributions, trial results, and completion rows.
- Changing sampling settings should clear trial or completion output that was produced under the previous settings.
- Explicit model calls should stay behind user actions such as `Generate`, `Step`, or `Run Trials`.

This keeps the teaching display aligned with the currently visible controls.

## Extension Points

Future visualizations can reuse:

- `VisualizationShell` for status checks and instructions.
- shadcn/ui primitives under `src/components/ui`.
- provider adapters under `src/lib`.
- token display helpers under `src/lib/tokenization`.
- deterministic fixture engines when the lesson needs stable, replayable behavior.

If a visualization needs a new provider, add a small adapter rather than wiring provider-specific fetch calls into the component.

## Testing Strategy

- Use `npm run typecheck` for TypeScript.
- Use `npm run lint` for static code quality.
- Use `npm run test` for fast unit tests. Current tests cover sampling utilities, token-path helpers, and the FSM engine.
- Use `npm run build` before publishing or pushing meaningful UI changes.
- For model-backed behavior, use `./scripts/check-ollama.sh` and smoke test the relevant endpoint.

Recommended smoke tests after model-backed changes:

```bash
curl -s http://127.0.0.1:8787/api/health
curl -s -X POST http://127.0.0.1:8787/api/token-distribution \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Complete this sentence: The model chose","generated":" the","maxCandidates":3}'
```
