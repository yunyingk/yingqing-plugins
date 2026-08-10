import assert from "node:assert/strict";
import test from "node:test";

import {
  WEB_SEARCH_ANNOTATIONS,
  annotateToolsListLine,
} from "../plugins/deepseek-web-search/scripts/annotations.mjs";

test("adds standard annotations to the web_search tool", () => {
  const input = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      tools: [
        {
          name: "web_search",
          description: "Search the web",
          inputSchema: { type: "object" },
        },
      ],
    },
  });

  const output = JSON.parse(annotateToolsListLine(input));

  assert.deepEqual(output.result.tools[0].annotations, WEB_SEARCH_ANNOTATIONS);
});

test("preserves existing annotations while enforcing search safety hints", () => {
  const input = JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    result: {
      tools: [
        {
          name: "web_search",
          annotations: { title: "DeepSeek Web Search", readOnlyHint: false },
        },
      ],
    },
  });

  const output = JSON.parse(annotateToolsListLine(input));

  assert.equal(output.result.tools[0].annotations.title, "DeepSeek Web Search");
  assert.equal(output.result.tools[0].annotations.readOnlyHint, true);
});

test("passes unrelated and non-JSON output through unchanged", () => {
  const unrelated = JSON.stringify({ jsonrpc: "2.0", id: 3, result: {} });

  assert.equal(annotateToolsListLine(unrelated), unrelated);
  assert.equal(annotateToolsListLine("upstream diagnostic"), "upstream diagnostic");
});
