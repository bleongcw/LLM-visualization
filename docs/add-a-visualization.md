# Add a Visualization

## Steps

1. Create a folder under `src/visualizations/<your-visualization-id>`.
2. Add the React entry component.
3. Add any local types, copy, panels, or helpers inside that folder.
4. Register the module in `src/visualizations/index.ts`.
5. Reuse `VisualizationShell` unless the new demo needs a genuinely different frame.
6. Add API routes only when the browser cannot safely or cleanly do the work itself.

## Suggested Folder

```text
src/visualizations/attention-map/
  attention-map.tsx
  types.ts
  info-copy.ts
```

## Design Rules

- Keep the first screen usable, not a landing page.
- Prefer dense, readable teaching panels over decorative layouts.
- Use shadcn/ui primitives for controls, dialogs, sheets, badges, cards, and tabs.
- Keep model/provider details behind adapters in `src/lib` or `server`.
- Add one focused test or verification path for the learning goal.

## Registration Example

```ts
import { AttentionMap } from "@/visualizations/attention-map/attention-map"

export const visualizations = [
  {
    id: "attention-map",
    title: "Attention Map",
    path: "/attention-map",
    description: "Show how token-to-token attention changes across layers.",
    instructions: ["Choose a prompt.", "Inspect attention weights."],
    examples: [],
    component: AttentionMap,
  },
]
```
