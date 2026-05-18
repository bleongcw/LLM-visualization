# Changelog

All notable changes to this repository will be documented here.

## v0.0.4 - 2026-05-17

### Added

- Added the `Constrained Generation with Finite State Machines (FSM)` visualization as the fourth registry-backed section.
- Added a deterministic finite-state-machine simulator for schema-constrained JSON output.
- Added prompt presets for function calls, sentiment classification, and data extraction.
- Added a target schema panel, FSM diagram, playback controls, token masking comparison, and constrained-vs-unconstrained output comparison.
- Added unit tests for FSM masking, probability renormalization, state-specific token allowance, required field tracking, fixture validity, and full trace generation.

### Changed

- Updated README, usage, architecture, and extension docs for constrained generation with finite state machines.

## v0.0.3 - 2026-05-17

### Added

- Added the `How Sampling Shapes Output` visualization as a third registry-backed section.
- Added a choose-your-own-completion panel that fetches follow-up token distributions after each selected token.
- Added cumulative path probability for selected completion paths.
- Added a multiple-completions panel that samples several continuations from the same prompt and settings.
- Added confidence-colored completion token chips and match/divergence comparison against row #1.
- Added path utility tests for cumulative probability, confidence bands, divergence, immutable token append behavior, and prompt previews.

### Changed

- Extended `POST /api/token-distribution` to accept a `generated` prefix for continuation-aware token distributions.
- Expanded README, usage, architecture, and extension documentation for the third visualization.
- Added fuller local setup, demo, troubleshooting, shadcn MCP, and contributor guidance across repository docs.

## v0.0.2 - 2026-05-17

### Added

- Added the `Selecting Next Token` visualization as a second registry-backed section.
- Added clickable visualization tabs in the app shell.
- Added a local `POST /api/token-distribution` endpoint for Ollama top-token candidate distributions.
- Added client-side sampling controls for temperature, Top-K, and Top-P.
- Added histogram and wheel probability views.
- Added trial animation controls and generated answer rows for repeated sampling demonstrations.
- Added sampling utility tests using the Node test runner.

### Changed

- Expanded repository documentation and usage instructions for both visualizations.
- Updated the visualization shell heading to read from each visualization definition instead of hardcoding the autoregressive-loop title.
- Renamed the first navigation tab to `Auto Regression Loop` while preserving the existing module id and route metadata.

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
