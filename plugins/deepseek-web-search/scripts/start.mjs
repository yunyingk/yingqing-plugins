#!/usr/bin/env node

import process from "node:process";

import { resolveConfig } from "./config.mjs";
import { runStdioServer } from "./server/protocol.mjs";

let config;
try {
  config = resolveConfig();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

if (!config.apiKey) {
  process.stderr.write("DeepSeek API token is required. Configure api_key in the plugin page.\n");
  process.exit(1);
}

runStdioServer(config);
