# Engineering Principles

This project follows Karpathy-inspired coding-agent principles from `forrestchang/andrej-karpathy-skills`.

## Think Before Coding

State assumptions, surface ambiguity, and choose deliberately. If two interpretations would produce meaningfully different code, clarify or record the assumption.

## Simplicity First

Build the minimum code that solves the actual problem. Avoid speculative abstractions and configuration until a second use case proves the need.

## Surgical Changes

Touch the code required for the task. Do not refactor unrelated files or clean up old code unless the current change created the mess.

## Goal-Driven Execution

Tie work to verifiable outcomes. For every non-trivial change, define what success looks like and run the smallest useful verification.

## Project Defaults

- Keep visualizations modular and independently understandable.
- Keep model/provider calls behind adapters.
- Prefer real model data when the learning goal depends on model behavior; prefer deterministic fixtures when the lesson needs a stable, replayable trace.
- Keep docs close to the implementation so future visualizations are easy to add.
- Keep expensive model calls explicit and user-initiated.
- Reset stale derived output when its prompt, system instruction, or sampling settings change.

## Documentation Defaults

- Every visualization should have in-app instructions and README-level usage notes.
- User-facing docs should explain what to click, what to observe, and what the result means.
- Architecture docs should explain shared contracts, API routes, and provider boundaries.
- Changelog entries should describe user-visible changes first, then technical support work.
- Extension docs should name the pattern a future contributor should copy.
- Usage docs should include at least one concrete exercise per visualization.

## Verification Defaults

Run the smallest useful checks for the change:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For model-backed work, also verify Ollama:

```bash
./scripts/check-ollama.sh
```

If the API route changed, smoke test it with `curl` while `npm run dev` is running. If the UI changed, do at least one browser walkthrough of the affected visualization.
