---
name: deepseek-web-search
description: Use when a request needs current web information, source-backed research, fact checking, release notes, prices, schedules, or other knowledge that may have changed recently. Uses DeepSeek native server-side web search through its Anthropic Messages API.
---

# DeepSeek Web Search

Use the plugin-provided `web_search` MCP tool when the answer depends on current or externally verifiable information.

## Workflow

1. Turn the request into a focused search query. Preserve product names, versions, dates, and other exact identifiers.
2. Call `web_search` once with the best query. Search again only when the first result leaves a material gap.
3. Answer in the user's language.
4. Keep source URLs attached to the claims they support. Never invent a URL or claim that a source says something it does not.
5. If search quality is poor, say so and suggest a more precise query.

Do not use web search for local repository facts that can be established directly from files in the workspace.
