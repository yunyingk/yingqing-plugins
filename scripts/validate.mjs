import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");

async function json(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

const marketplace = await json(".claude-plugin/marketplace.json");
const plugin = await json("plugins/deepseek-web-search/.claude-plugin/plugin.json");
const mcp = await json("plugins/deepseek-web-search/.mcp.json");

const errors = [];
const entry = marketplace.plugins?.find((item) => item.name === plugin.name);

if (marketplace.name !== "yingqing-plugins") errors.push("Unexpected marketplace name");
if (!entry) errors.push("Plugin is missing from marketplace.json");
if (entry?.source !== "./plugins/deepseek-web-search") errors.push("Unexpected plugin source");
if (entry?.version !== plugin.version) errors.push("Marketplace and plugin versions differ");
if (plugin.userConfig?.model?.default !== "deepseek-v4-flash") errors.push("Unexpected default model");
if (plugin.userConfig?.base_url?.default !== "https://api.deepseek.com/anthropic") errors.push("Unexpected default base URL");
if (plugin.userConfig?.api_key?.sensitive === true) errors.push("API token must remain editable in the ZCode plugin page");
if (plugin.userConfig?.api_key?.required !== true) errors.push("API token must remain required");
if (!mcp.mcpServers?.["deepseek-web-search"]) errors.push("MCP server declaration is missing");

const serialized = JSON.stringify({ marketplace, plugin, mcp });
if (/sk-[A-Za-z0-9]/.test(serialized)) errors.push("A token-like value was committed to configuration");

const startScript = await readFile(resolve(root, "plugins/deepseek-web-search/scripts/start.mjs"), "utf8");
if (startScript.includes("@kyaulabs/deepseek-websearch")) errors.push("Runtime must not download the upstream MCP package");

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Marketplace, plugin manifest, and MCP configuration are valid.");
