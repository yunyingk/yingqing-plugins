# Upstream attribution

The initial search, formatting, and error-handling implementation was adapted from:

- Repository: `https://github.com/kyaulabs/deepseek-websearch-mcp`
- Imported commit: `0563459216727b950d205b5a5bfff85e7bd5304a`
- Upstream package version at import: `1.0.4`
- License: MIT; see `THIRD_PARTY_LICENSES/KYAU-LABS-MIT.txt`

Local changes include:

- a dependency-free MCP stdio protocol adapter maintained in this repository;
- removal of the unused `explanation` tool argument;
- standard read-only, non-destructive, idempotent, open-world annotations;
- direct plugin configuration without an npm or `npx` runtime dependency;
- concurrent handling when the MCP client submits overlapping requests.
