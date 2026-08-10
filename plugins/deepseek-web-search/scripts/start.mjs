#!/usr/bin/env node

import process from "node:process";

import { resolveConfig } from "./config.mjs";
import { runStdioServer } from "./server/protocol.mjs";

const MINIMUM_NODE_MAJOR = 24;
const nodeMajor = Number.parseInt(process.versions.node, 10);

if (!Number.isInteger(nodeMajor) || nodeMajor < MINIMUM_NODE_MAJOR) {
  process.stderr.write(
    `deepseek-web-search requires Node.js ${MINIMUM_NODE_MAJOR} or newer; current version is ${process.versions.node}.\n`,
  );
  process.exit(1);
}

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
