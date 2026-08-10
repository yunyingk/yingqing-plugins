#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";
import { resolveConfig, toServerEnv } from "./config.mjs";

const PACKAGE = "@kyaulabs/deepseek-websearch@1.0.4";
let config;

try {
  config = resolveConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (!config.apiKey) {
  console.error(
    "DeepSeek API token is required. Configure the plugin's api_key option "
    + "or set DEEPSEEK_API_KEY in the MCP host environment.",
  );
  process.exit(1);
}

const child = spawn("npx", ["--yes", PACKAGE], {
  env: toServerEnv(config),
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to start ${PACKAGE}: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
