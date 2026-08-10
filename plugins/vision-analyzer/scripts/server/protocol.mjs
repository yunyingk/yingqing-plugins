import readline from "node:readline";
import process from "node:process";
import { analyzeImage, TASKS } from "./vision.mjs";

export const ANALYZE_IMAGE_TOOL = Object.freeze({
  name: "analyze_image",
  description: "Analyze an attached or local image, screenshot, document, table, chart, diagram, handwritten note, or photo with a dedicated vision model.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Absolute or relative local image path." },
      url: { type: "string", description: "Public HTTP(S) image URL." },
      base64: { type: "string", description: "Raw Base64 image, with or without a data URL prefix." },
      mime_type: { type: "string", description: "Optional MIME type override for Base64 or local input." },
      task: { type: "string", enum: Object.keys(TASKS), default: "general" },
      prompt: { type: "string", description: "The specific question or extraction instruction." },
      response_mode: { type: "string", enum: ["markdown", "json", "plain_text"], default: "markdown" },
      model: { type: "string", description: "Optional per-call model override." },
      max_tokens: { type: "integer", minimum: 1, maximum: 32768, default: 4096 },
      temperature: { type: "number", minimum: 0, maximum: 2, default: 0.2 },
      detail: { type: "string", enum: ["low", "high", "auto"] },
      system: { type: "string", description: "Optional extra domain guidance." },
    },
    additionalProperties: false,
  },
  annotations: {
    title: "Analyze image",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
});

const success = (id, result) => ({ jsonrpc: "2.0", id, result });
const failure = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

export function createRequestHandler(config, options = {}) {
  const analyze = options.analyze ?? analyzeImage;
  const notify = options.notify ?? (() => {});
  const active = new Map();

  async function handle(message) {
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") return failure(message?.id ?? null, -32600, "Invalid Request");
    if (message.method === "notifications/cancelled") {
      active.get(message.params?.requestId)?.abort();
      return null;
    }
    if (message.method.startsWith("notifications/")) return null;
    if (message.method === "initialize") return success(message.id, {
      protocolVersion: message.params?.protocolVersion ?? "2025-11-25",
      capabilities: { tools: {} },
      serverInfo: { name: "yingqing-vision-analyzer", version: "0.2.0" },
    });
    if (message.method === "ping") return success(message.id, {});
    if (message.method === "tools/list") return success(message.id, { tools: [ANALYZE_IMAGE_TOOL] });
    if (message.method !== "tools/call") return failure(message.id, -32601, `Method not found: ${message.method}`);
    if (message.params?.name !== "analyze_image") return failure(message.id, -32602, `Unknown tool: ${message.params?.name ?? ""}`);

    const controller = new AbortController();
    const progressToken = message.params?._meta?.progressToken;
    let progress = 0;
    const reportProgress = (messageText) => {
      if (progressToken === undefined) return;
      notify({
        jsonrpc: "2.0",
        method: "notifications/progress",
        params: { progressToken, progress: ++progress, message: messageText },
      });
    };
    active.set(message.id, controller);
    reportProgress("Preparing image analysis");
    const heartbeat = setInterval(() => reportProgress("Vision model is still working"), 5000);

    try {
      const result = await analyze(message.params?.arguments ?? {}, config, {
        signal: controller.signal,
        onStreamEvent: () => {},
      });
      reportProgress("Vision analysis completed");
      const content = [{ type: "text", text: result.text }];
      if (config.showUsage && result.responseMode !== "json") {
        content.push({ type: "text", text: `\n---\n${JSON.stringify({ model: result.model, usage: result.usage })}` });
      }
      return success(message.id, { content });
    } catch (error) {
      return success(message.id, {
        isError: true,
        content: [{ type: "text", text: `analyze_image failed: ${error instanceof Error ? error.message : String(error)}` }],
      });
    } finally {
      clearInterval(heartbeat);
      active.delete(message.id);
    }
  }

  handle.cancelAll = () => {
    for (const controller of active.values()) controller.abort();
    active.clear();
  };
  return handle;
}

export function runStdioServer(config) {
  const write = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
  const handle = createRequestHandler(config, { notify: write });
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  input.on("line", (line) => {
    if (!line.trim()) return;
    let message;
    try { message = JSON.parse(line); } catch { write(failure(null, -32700, "Parse error")); return; }
    void handle(message).then((response) => { if (response) write(response); });
  });
  input.on("close", () => handle.cancelAll());
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { handle.cancelAll(); process.exit(0); });
}
