// MCP protocol adapter maintained by yingqing-plugins.

import readline from "node:readline";
import process from "node:process";

import { WEB_SEARCH_ANNOTATIONS } from "../annotations.mjs";
import { SearchError } from "./errors.mjs";
import { formatError, formatResults } from "./format.mjs";
import { searchWeb } from "./search.mjs";

export const WEB_SEARCH_TOOL = Object.freeze({
  name: "web_search",
  description: "Search the web for current or externally verifiable information and return a synthesized answer with source URLs.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The complete search question. Include relevant names, dates, versions, and constraints.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  annotations: WEB_SEARCH_ANNOTATIONS,
});

function success(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function failure(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export function createRequestHandler(config, options = {}) {
  const search = options.search ?? searchWeb;
  const activeRequests = new Map();

  async function handle(message) {
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
      return failure(message?.id ?? null, -32600, "Invalid Request");
    }

    if (message.method === "notifications/cancelled") {
      activeRequests.get(message.params?.requestId)?.abort();
      return null;
    }

    if (message.method.startsWith("notifications/")) return null;

    if (message.method === "initialize") {
      return success(message.id, {
        protocolVersion: message.params?.protocolVersion ?? "2025-11-25",
        capabilities: { tools: {} },
        serverInfo: { name: "yingqing-deepseek-web-search", version: "0.2.3" },
      });
    }

    if (message.method === "ping") return success(message.id, {});
    if (message.method === "tools/list") return success(message.id, { tools: [WEB_SEARCH_TOOL] });

    if (message.method !== "tools/call") {
      return failure(message.id, -32601, `Method not found: ${message.method}`);
    }

    if (message.params?.name !== "web_search") {
      return failure(message.id, -32602, `Unknown tool: ${message.params?.name ?? ""}`);
    }

    const query = message.params?.arguments?.query?.trim();
    if (!query) {
      return success(message.id, {
        content: [{ type: "text", text: "Error: empty search query." }],
        isError: true,
      });
    }

    const controller = new AbortController();
    activeRequests.set(message.id, controller);
    try {
      const response = await search(query, config, { signal: controller.signal });
      return success(message.id, {
        content: [{ type: "text", text: formatResults(query, response) }],
      });
    } catch (error) {
      return success(message.id, {
        content: [{
          type: "text",
          text: error instanceof SearchError
            ? formatError(error)
            : `Web search failed: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      });
    } finally {
      activeRequests.delete(message.id);
    }
  }

  handle.cancelAll = () => {
    for (const controller of activeRequests.values()) controller.abort();
    activeRequests.clear();
  };

  return handle;
}

export function runStdioServer(config) {
  const handle = createRequestHandler(config);
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

  input.on("line", (line) => {
    if (!line.trim()) return;

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      process.stdout.write(`${JSON.stringify(failure(null, -32700, "Parse error"))}\n`);
      return;
    }

    void handle(message).then((response) => {
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    });
  });

  input.on("close", () => handle.cancelAll());
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      handle.cancelAll();
      process.exit(0);
    });
  }
}
