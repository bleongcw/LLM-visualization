# shadcn MCP Setup for Codex

This project uses shadcn/ui as owned source code. Components are copied into `src/components/ui`, so they can be changed directly.

## Codex MCP Configuration

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

Restart Codex after editing the config.

## Project Configuration

The project includes `components.json`, which tells shadcn where Tailwind, aliases, and component files live.

Existing reusable primitives live in `src/components/ui`. Visualization-specific compositions should live in the visualization folder or under `src/components/*`, not in `src/components/ui`.

## Example Prompts

- Show available shadcn components for a dashboard-like teaching app.
- Add the button, card, dialog, sheet, tabs, tooltip, badge, input, and textarea components.
- Find a compact pattern for an instructions drawer.
- Add an accessible slider component that matches the existing Tailwind theme.
- Suggest a segmented-control pattern for switching between Histogram and Wheel views.

## App UI Patterns

- Use `Button` for commands such as `Generate`, `Step`, `Run Trials`, and `Restart`.
- Use `Tabs` for prompt modes such as `User` and `System`.
- Use `Dialog` for tutorials and small explanatory popups.
- Use `Sheet` for long instructions.
- Use `Card` only for individual panels or repeated framed content.
- Keep teaching panels compact and scannable.

## Notes

- The standard shadcn registry works without extra registry configuration.
- Private or third-party registries can be added later through `components.json`.
- Keep reusable primitives in `src/components/ui`; composed app components belong elsewhere.
- shadcn components are source, not a locked dependency. If a component needs small project-specific changes, edit the local copy.
