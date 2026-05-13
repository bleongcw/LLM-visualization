# Architecture

## Shape

The app has three layers:

- Browser UI: Vite, React, TypeScript, Tailwind, and shadcn/ui components.
- Visualization registry: each concept demo is a self-contained module.
- Local API proxy: an Express server that talks to Ollama.

## Visualization Modules

Every visualization should export a React component and be registered in `src/visualizations/index.ts`.

The shared `VisualizationDefinition` includes:

- `id`
- `title`
- `path`
- `description`
- `modelBadge`
- `instructions`
- `examples`
- `capabilities`
- `component`

This keeps routing, navigation, docs, and capability checks separate from each visualization's internal state.

## Provider Adapter

Ollama-specific browser calls live in `src/lib/ollama/*`.

Server-side Ollama calls live in `server/ollama.ts`. Visualizations should not call `http://127.0.0.1:11434` directly from React components. Use the local app API instead.

## Extension Points

Future visualizations can reuse:

- `VisualizationShell` for status checks and instructions.
- shadcn/ui primitives under `src/components/ui`.
- provider adapters under `src/lib`.
- token display helpers under `src/lib/tokenization`.

If a visualization needs a new provider, add a small adapter rather than wiring provider-specific fetch calls into the component.
