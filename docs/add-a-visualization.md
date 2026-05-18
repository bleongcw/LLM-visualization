# Add a Visualization

The app is registry-driven. A new visualization should be a self-contained module that plugs into the shared shell and navigation.

## Steps

1. Create a folder under `src/visualizations/<your-visualization-id>`.
2. Add the React entry component.
3. Add local types, copy, panels, helpers, and tests inside that folder.
4. Keep reusable model/provider calls in `src/lib/*` or `server/*`.
5. Register the module in `src/visualizations/index.ts`.
6. Reuse `VisualizationShell` unless the new demo needs a genuinely different frame.
7. Add API routes only when the browser cannot safely or cleanly do the work itself.
8. Update README, architecture notes, usage docs, and changelog.

## Implementation Checklist

Before writing UI, decide:

- What concept the user should understand after one minute.
- What model data the visualization needs.
- Whether the visualization needs live Ollama data, derived browser-side data, or deterministic fixtures.
- Which action starts an expensive model call.
- What should reset when the prompt, system instruction, model output, or sampling setting changes.
- Which helper functions can be tested without a browser.

Then implement in this order:

1. Add types and pure helpers.
2. Add focused tests for those helpers.
3. Build the visualization component with static or empty states.
4. Connect the local API or existing provider adapter.
5. Register the visualization.
6. Update docs and changelog.
7. Run verification.

## Suggested Folder

```text
src/visualizations/attention-map/
  attention-map.tsx
  types.ts
  info-copy.ts
  attention-map.test.ts
  components/
    attention-grid.tsx
```

For larger visualizations, follow the Selecting Next Token pattern:

```text
src/visualizations/selecting-next-token/
  index.ts
  selecting-next-token.tsx
  sampling.ts
  sampling.test.ts
  types.ts
```

For visualizations that build a multi-step generation path, follow the How Sampling Shapes Output pattern:

```text
src/visualizations/how-sampling-shapes-output/
  index.ts
  how-sampling-shapes-output.tsx
  sampling-path.ts
  sampling-path.test.ts
  types.ts
```

Keep path math, token confidence, and display helpers in small utility files so they can be tested without a browser or a running model.

For deterministic teaching simulations, follow the Constrained Generation with Finite State Machines (FSM) pattern:

```text
src/visualizations/constrained-generation-fsm/
  index.ts
  constrained-generation-fsm.tsx
  fsm-engine.ts
  fsm-engine.test.ts
  fsm-fixtures.ts
  types.ts
```

Use this pattern when the learning objective needs a stable replayable trace rather than live model variance. Keep the simulator engine pure, put examples in fixture files, and test the engine directly.

## Design Rules

- Keep the first screen usable, not a landing page.
- Prefer dense, readable teaching panels over decorative layouts.
- Use shadcn/ui primitives for controls, dialogs, sheets, badges, cards, tabs, and tooltips.
- Keep model/provider details behind adapters in `src/lib` or `server`.
- Keep expensive model calls explicit. Use buttons such as `Generate`, `Step`, or `Run` rather than firing model calls on every keystroke.
- Make local state easy to reset when a prompt, model result, or major parameter changes.
- Add one focused test or verification path for the learning goal.

## Registration Example

```ts
import { AttentionMap } from "@/visualizations/attention-map/attention-map"

export const visualizations = [
  {
    id: "attention-map",
    title: "Attention Map",
    heading: "1.3. Attention map",
    path: "/attention-map",
    description: "Show how token-to-token attention changes across layers.",
    modelBadge: "qwen3:0.6b",
    instructions: ["Choose a prompt.", "Inspect attention weights."],
    examples: [],
    capabilities: [
      {
        provider: "ollama",
        model: "qwen3:0.6b",
        features: ["attention"],
      },
    ],
    component: AttentionMap,
  },
]
```

## Documentation Checklist

When adding a visualization, update:

- `README.md`: add the visualization summary and user flow.
- `docs/usage.md`: add step-by-step app instructions.
- `docs/architecture.md`: document any new API route, state rule, or shared abstraction.
- `docs/add-a-visualization.md`: add a pattern note if the new module introduces a reusable shape.
- `CHANGELOG.md`: add an entry with the user-visible change.

Every new visualization should also provide:

- registry `instructions` for the in-app drawer
- a short tutorial or first-run guidance in the component
- at least one suggested exercise in `docs/usage.md`
- a clear note on whether it uses live model data, client-side derived data, deterministic fixtures, or a mix

## Verification Checklist

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For model-backed visualizations, also run:

```bash
./scripts/check-ollama.sh
```

If the change touches API behavior, smoke test the route with `curl` while `npm run dev` is running.
