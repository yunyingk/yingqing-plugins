import { spawn } from "node:child_process";
import process from "node:process";
import { normalizeVisionBaseUrl } from "./config.mjs";

const MINIMUM_NODE_MAJOR = 24;
const UPSTREAM_PACKAGE = "@winton979/vision-mcp@0.2.0";
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

if (nodeMajor < MINIMUM_NODE_MAJOR) {
  process.stderr.write(
    `[vision-analyzer] Node.js ${MINIMUM_NODE_MAJOR}+ is required; current version is ${process.versions.node}.\n`,
  );
  process.exit(1);
}

const child = spawn("npx", ["-y", UPSTREAM_PACKAGE], {
  env: {
    ...process.env,
    VISION_API_KEY: process.env.VISION_PLUGIN_API_KEY ?? "",
    VISION_BASE_URL: normalizeVisionBaseUrl(process.env.VISION_PLUGIN_BASE_URL),
    VISION_MODEL: process.env.VISION_PLUGIN_MODEL || "gpt-4o",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  process.stderr.write(`[vision-analyzer] failed to start ${UPSTREAM_PACKAGE}: ${error.message}\n`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
