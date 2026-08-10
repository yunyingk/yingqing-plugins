---
name: vision-analyzer
description: Use when a request requires reading, describing, extracting text from, comparing, or inspecting an attached, local, or remote image with a dedicated vision tool.
---

# Vision Analyzer

Use the plugin-provided `analyze_image` MCP tool when visual content must be understood.

## Workflow

1. For a chat attachment or local image, pass its available local filesystem path as `path`. For a public image, use `url`. Use `base64` only when neither form is available.
2. Choose the closest `task`: `general`, `ocr`, `ui_review`, `document`, `table`, `diagram`, `chart`, `receipt`, `math`, or `code`.
3. Put the user's actual question or requested extraction in `prompt`; do not replace it with a generic description request.
4. Prefer `markdown` response mode. Use `json` only when the caller needs machine-readable fields and the configured service supports JSON response format.
5. Report uncertainty when image detail is insufficient. Never invent text, objects, values, or layout that the tool did not establish.

If an attachment is visible to the user but no local path, URL, or bytes are available to the agent, ask for an accessible path or URL.
