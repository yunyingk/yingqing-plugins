import assert from "node:assert/strict";
import test from "node:test";

import { createRequestHandler } from "../plugins/vision-analyzer/scripts/server/protocol.mjs";
import { analyzeImage, buildVisionRequest } from "../plugins/vision-analyzer/scripts/server/vision.mjs";

const config = {
  apiKey: "test-token",
  baseUrl: "https://vision.example/v1",
  model: "test-vision",
  showUsage: false,
};

test("builds a streaming OpenAI-compatible vision request", () => {
  const body = buildVisionRequest(
    { prompt: "Describe it", task: "general", max_tokens: 512, detail: "low" },
    "data:image/png;base64,AA==",
    config,
  );
  assert.equal(body.stream, true);
  assert.equal(body.max_tokens, 512);
  assert.equal(body.messages[1].content[0].image_url.detail, "low");
});

test("parses streamed vision content and reasoning", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    const chunks = [
      { model: "test-vision", choices: [{ delta: { reasoning_content: "thinking" } }] },
      { model: "test-vision", choices: [{ delta: { content: "Visible answer" } }] },
      { model: "test-vision", choices: [], usage: { prompt_tokens: 10, completion_tokens: 2 } },
    ];
    return new Response(chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n", {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
  };
  const result = await analyzeImage({ base64: "AA==", mime_type: "image/png" }, config, { fetchImpl });
  assert.equal(request.url, "https://vision.example/v1/chat/completions");
  assert.equal(JSON.parse(request.options.body).stream, true);
  assert.equal(result.text, "Visible answer");
  assert.equal(result.usage.prompt_tokens, 10);
});

test("emits progress notifications for a long vision call", async () => {
  const notifications = [];
  const analyze = async () => ({ text: "done", usage: null, model: "test", responseMode: "markdown" });
  const handle = createRequestHandler(config, {
    analyze,
    notify: (notification) => notifications.push(notification),
  });
  const response = await handle({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "analyze_image",
      arguments: { path: "/tmp/example.png" },
      _meta: { progressToken: "vision-1" },
    },
  });
  assert.equal(response.result.content[0].text, "done");
  assert.equal(response.result.content.length, 1);
  assert.equal(notifications[0].params.progressToken, "vision-1");
  assert.ok(notifications.at(-1).params.progress > notifications[0].params.progress);
});

test("includes usage metadata only when explicitly configured", async () => {
  const analyze = async () => ({
    text: "done",
    usage: { prompt_tokens: 10, completion_tokens: 2 },
    model: "test-vision",
    responseMode: "markdown",
  });
  const handle = createRequestHandler({ ...config, showUsage: true }, { analyze });
  const response = await handle({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "analyze_image", arguments: { path: "/tmp/example.png" } },
  });
  assert.equal(response.result.content.length, 2);
  assert.match(response.result.content[1].text, /prompt_tokens/);
});
