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
- `docs/architecture.md`: document any new API route or shared abstraction.
- `CHANGELOG.md`: add an entry with the user-visible change.

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
