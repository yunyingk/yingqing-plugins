import process from "node:process";
import { normalizeVisionBaseUrl } from "./config.mjs";
import { runStdioServer } from "./server/protocol.mjs";

const MINIMUM_NODE_MAJOR = 24;
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

if (nodeMajor < MINIMUM_NODE_MAJOR) {
  process.stderr.write(
    `[vision-analyzer] Node.js ${MINIMUM_NODE_MAJOR}+ is required; current version is ${process.versions.node}.\n`,
  );
  process.exit(1);
}

runStdioServer({
  apiKey: process.env.VISION_PLUGIN_API_KEY ?? "",
  baseUrl: normalizeVisionBaseUrl(process.env.VISION_PLUGIN_BASE_URL),
  model: process.env.VISION_PLUGIN_MODEL || "gpt-4o",
});
