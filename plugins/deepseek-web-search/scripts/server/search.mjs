// Adapted from kyaulabs/deepseek-websearch-mcp (MIT).

import { SearchError, SearchErrorCode } from "./errors.mjs";
import { consumeSse } from "./sse.mjs";

export const SYSTEM_PROMPT = [
  "You are a web search assistant. Follow these rules strictly:",
  "",
  "1. Use web_search to find relevant, up-to-date information.",
  "2. After receiving results, write a comprehensive answer in plain text.",
  "   Include specific details, dates, and facts.",
  "3. Do NOT call web_search again after you have results.",
  "4. Answer in the same language the user used.",
  "5. If results are poor, explain why and suggest better keywords.",
].join("\n");

export function buildSearchRequest(query, config) {
  const body = {
    model: config.model,
    stream: true,
    max_tokens: Number(config.maxTokens),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: query }],
    tools: [{ type: config.webSearchVersion, name: "web_search" }],
    tool_choice: { type: "auto" },
  };

  if (config.thinking === "enabled") {
    body.thinking = { type: "enabled" };
  }

  return body;
}

export function parseSearchResponse(data) {
  const results = [];
  const textParts = [];

  if (!Array.isArray(data?.content)) {
    return { results, textAnswer: "" };
  }

  for (const block of data.content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === "web_search_result") {
          results.push({
            title: item.title || "Untitled",
            url: item.url || "",
            pageAge: item.page_age ?? null,
          });
        }
      }
    } else if (block.type === "text" && block.text?.trim()) {
      textParts.push(block.text.trim());
    }
  }

  return { results, textAnswer: textParts.join("\n\n") };
}

export async function parseSearchStream(response, options = {}) {
  const content = [];
  let usage = null;

  await consumeSse(response, (event) => {
    if (event.type === "error") {
      throw new SearchError(SearchErrorCode.API_ERROR, event.error?.message || "DeepSeek stream error");
    }
    if (event.type === "message_start") usage = event.message?.usage ?? usage;
    if (event.type === "message_delta") usage = { ...usage, ...event.usage };

    if (event.type === "content_block_start") {
      content[event.index] = structuredClone(event.content_block ?? {});
    } else if (event.type === "content_block_delta") {
      const block = content[event.index] ?? (content[event.index] = {});
      const delta = event.delta ?? {};
      if (typeof delta.text === "string") block.text = `${block.text ?? ""}${delta.text}`;
      if (typeof delta.thinking === "string") block.thinking = `${block.thinking ?? ""}${delta.thinking}`;
      if (typeof delta.partial_json === "string") block.partial_json = `${block.partial_json ?? ""}${delta.partial_json}`;
      if (Array.isArray(delta.content)) block.content = [...(block.content ?? []), ...delta.content];
    }
    options.onStreamEvent?.(event);
  });

  return { content: content.filter(Boolean), usage };
}

export async function searchWeb(query, config, options = {}) {
  if (!config.apiKey) {
    throw new SearchError(
      SearchErrorCode.MISSING_API_KEY,
      "No DeepSeek API key configured in the plugin.",
    );
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  let response;

  try {
    response = await fetchImpl(`${config.baseUrl.replace(/\/+$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(buildSearchRequest(query, config)),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new SearchError(SearchErrorCode.CANCELLED, "Search was cancelled.");
    }
    throw new SearchError(
      SearchErrorCode.NETWORK_ERROR,
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unable to read error body");
    const code = response.status === 429
      ? SearchErrorCode.RATE_LIMITED
      : SearchErrorCode.API_ERROR;
    throw new SearchError(
      code,
      `DeepSeek API error (${response.status}): ${errorText}`,
      response.status,
    );
  }

  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    return parseSearchResponse(await response.json());
  }
  return parseSearchResponse(await parseSearchStream(response, options));
}
