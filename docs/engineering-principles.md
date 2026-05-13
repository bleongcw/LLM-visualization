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
- Prefer real model data over mocked teaching data when the local runtime supports it.
- Keep docs close to the implementation so future visualizations are easy to add.
