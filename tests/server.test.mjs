import assert from "node:assert/strict";
import test from "node:test";

import {
  WEB_SEARCH_TOOL,
  createRequestHandler,
} from "../plugins/deepseek-web-search/scripts/server/protocol.mjs";
import {
  SYSTEM_PROMPT,
  buildSearchRequest,
  parseSearchResponse,
  searchWeb,
} from "../plugins/deepseek-web-search/scripts/server/search.mjs";

const config = {
  apiKey: "test-token",
  baseUrl: "https://proxy.example/anthropic/",
  model: "deepseek-v4-flash",
  webSearchVersion: "web_search_20250305",
  thinking: "enabled",
  maxTokens: "32768",
};

test("exposes a single query argument with standard annotations", async () => {
  const handle = createRequestHandler(config);
  const response = await handle({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  const tool = response.result.tools[0];

  assert.equal(tool, WEB_SEARCH_TOOL);
  assert.doesNotMatch(tool.description, /DeepSeek|Anthropic|Messages API/i);
  assert.deepEqual(Object.keys(tool.inputSchema.properties), ["query"]);
  assert.deepEqual(tool.inputSchema.required, ["query"]);
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(tool.annotations.idempotentHint, true);
});

test("maps query directly to the DeepSeek user message", () => {
  const body = buildSearchRequest("latest Node.js release", config);

  assert.equal(body.system, SYSTEM_PROMPT);
  assert.deepEqual(body.messages, [
    { role: "user", content: "latest Node.js release" },
  ]);
  assert.equal(body.max_tokens, 32768);
  assert.equal(body.stream, true);
  assert.equal(body.tools[0].type, "web_search_20250305");
  assert.deepEqual(body.thinking, { type: "enabled" });
});

test("calls the configured endpoint and parses text with sources", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    const events = [
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Current answer" } },
      {
        type: "content_block_start",
        index: 1,
        content_block: {
          type: "web_search_tool_result",
          content: [{
            type: "web_search_result",
            title: "Source",
            url: "https://example.com/source",
            page_age: "today",
          }],
        },
      },
      { type: "message_stop" },
    ];
    return new Response(`: keep-alive\n\n${events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")}`, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
  };

  const response = await searchWeb("current topic", config, { fetchImpl });

  assert.equal(request.url, "https://proxy.example/anthropic/v1/messages");
  assert.equal(request.options.headers["x-api-key"], "test-token");
  assert.equal(JSON.parse(request.options.body).messages[0].content, "current topic");
  assert.deepEqual(response, {
    textAnswer: "Current answer",
    results: [{
      title: "Source",
      url: "https://example.com/source",
      pageAge: "today",
    }],
  });
});

test("emits MCP progress heartbeats when the caller supplies a progress token", async () => {
  const notifications = [];
  const search = async () => ({ results: [], textAnswer: "done" });
  const handle = createRequestHandler(config, {
    search,
    notify: (notification) => notifications.push(notification),
  });
  await handle({
    jsonrpc: "2.0",
    id: "progress",
    method: "tools/call",
    params: {
      name: "web_search",
      arguments: { query: "current topic" },
      _meta: { progressToken: "token-1" },
    },
  });
  assert.equal(notifications[0].method, "notifications/progress");
  assert.equal(notifications[0].params.progressToken, "token-1");
  assert.ok(notifications.at(-1).params.progress > notifications[0].params.progress);
});

test("accepts concurrent tool calls without serializing them", async () => {
  const started = [];
  const resolvers = [];
  const search = (query) => new Promise((resolve) => {
    started.push(query);
    resolvers.push(() => resolve({ results: [], textAnswer: query }));
  });
  const handle = createRequestHandler(config, { search });

  const first = handle({
    jsonrpc: "2.0",
    id: "first",
    method: "tools/call",
    params: { name: "web_search", arguments: { query: "one" } },
  });
  const second = handle({
    jsonrpc: "2.0",
    id: "second",
    method: "tools/call",
    params: { name: "web_search", arguments: { query: "two" } },
  });

  assert.deepEqual(started, ["one", "two"]);
  resolvers.forEach((resolve) => resolve());
  const responses = await Promise.all([first, second]);
  assert.deepEqual(responses.map((response) => response.id), ["first", "second"]);
});

test("parses an empty DeepSeek response safely", () => {
  assert.deepEqual(parseSearchResponse({}), { results: [], textAnswer: "" });
});
