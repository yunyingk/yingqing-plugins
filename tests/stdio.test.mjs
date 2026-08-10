import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import readline from "node:readline";
import test from "node:test";

const startScript = resolve(
  import.meta.dirname,
  "../plugins/deepseek-web-search/scripts/start.mjs",
);

test("serves the locally maintained MCP tool over stdio", async () => {
  const child = spawn(process.execPath, [startScript], {
    env: {
      ...process.env,
      DEEPSEEK_PLUGIN_API_KEY: "test-token",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const lines = readline.createInterface({ input: child.stdout });
  const responses = [];
  lines.on("line", (line) => responses.push(JSON.parse(line)));

  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-11-25" },
  })}\n`);
  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
  })}\n`);

  const deadline = Date.now() + 3000;
  while (responses.length < 2 && Date.now() < deadline) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  }

  child.stdin.end();
  const [exitCode] = await once(child, "exit");

  assert.equal(exitCode, 0);
  assert.equal(responses[0].result.serverInfo.name, "yingqing-deepseek-web-search");
  assert.equal(responses[0].result.serverInfo.version, "0.2.3");
  assert.deepEqual(
    Object.keys(responses[1].result.tools[0].inputSchema.properties),
    ["query"],
  );
  assert.equal(responses[1].result.tools[0].annotations.readOnlyHint, true);
  assert.equal(responses[1].result.tools[0].annotations.openWorldHint, true);
});
