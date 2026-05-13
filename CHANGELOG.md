# Changelog

All notable changes to this repository will be documented here.

## v0.0.1 - 2026-05-13

### Added

- Created the `LLM-visualization` Vite, React, TypeScript, Tailwind, and shadcn-style UI project.
- Added the first visualization module: the autoregressive loop for local LLM generation.
- Added an extensible visualization registry so future demos can be added under `src/visualizations/*`.
- Added a reusable application shell and visualization shell with Ollama health checks and an instructions drawer.
- Added a local Express API proxy with:
  - `GET /api/health`
  - `POST /api/next-token`
- Integrated Ollama `qwen3:0.6b` for local next-token generation with real `top_logprobs`.
- Added panels for prompt input, response output, input tokens, probability ranking, selected token, and stop/continue conditions.
- Added tutorial and information dialogs for the teaching flow.
- Added project documentation:
  - `README.md`
  - `docs/architecture.md`
  - `docs/add-a-visualization.md`
  - `docs/shadcn-mcp.md`
  - `docs/engineering-principles.md`
- Added `scripts/check-ollama.sh` to verify Ollama and the required model locally.

### Fixed

- Fixed a browser startup blank screen caused by a circular import between the visualization registry and the autoregressive loop component.
- Added a visible loading fallback in `index.html` so startup failures are easier to distinguish from an empty page.
- Fixed repeated greedy tokens by switching next-token calls from raw `/api/generate` prompt reconstruction to `/api/chat` with assistant prefill.

### Verified

- Verified `npm run typecheck`.
- Verified `npm run lint`.
- Verified `npm run build`.
- Verified local Ollama health checks with `qwen3:0.6b`.
- Verified live next-token behavior returns a natural continuation after the first generated token.
