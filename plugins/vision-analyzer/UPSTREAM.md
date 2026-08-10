# Upstream

- Project: `winton979/vision-mcp`
- Package: `@winton979/vision-mcp@0.2.0`
- Source: https://github.com/winton979/vision-mcp
- License: MIT
- Integration: the plugin starts the pinned published package through `npx`; upstream source is not yet vendored

The local launcher maps ZCode user configuration to the upstream environment variables and normalizes the configured service root to the `/v1` base expected by the upstream server. The upstream server then appends `/chat/completions`.
