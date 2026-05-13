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

## Example Prompts

- Show available shadcn components for a dashboard-like teaching app.
- Add the button, card, dialog, sheet, tabs, tooltip, badge, input, and textarea components.
- Find a compact pattern for an instructions drawer.

## Notes

- The standard shadcn registry works without extra registry configuration.
- Private or third-party registries can be added later through `components.json`.
- Keep reusable primitives in `src/components/ui`; composed app components belong elsewhere.
