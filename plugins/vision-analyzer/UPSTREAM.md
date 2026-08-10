# Upstream

- Project: `winton979/vision-mcp`
- Reference package: `@winton979/vision-mcp@0.2.0`
- Source: https://github.com/winton979/vision-mcp
- License: MIT
- Integration: selected image handling, prompts, and tool-shape ideas were adapted under MIT; the runtime is now locally maintained source code

The plugin no longer installs, imports, or starts the upstream npm package. Its local implementation adds OpenAI-compatible SSE streaming, MCP progress heartbeats, cancellation, explicit tool annotations, and a 120-second ZCode server timeout.
