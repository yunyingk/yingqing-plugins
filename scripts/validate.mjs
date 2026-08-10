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
const packageJson = await json("package.json");

const errors = [];
const entry = marketplace.plugins?.find((item) => item.name === plugin.name);

if (marketplace.name !== "yingqing-plugins") errors.push("Unexpected marketplace name");
if (!entry) errors.push("Plugin is missing from marketplace.json");
if (entry?.source !== "./plugins/deepseek-web-search") errors.push("Unexpected plugin source");
if (entry?.version !== plugin.version) errors.push("Marketplace and plugin versions differ");
if (packageJson.version !== plugin.version) errors.push("Repository and plugin versions differ");
if (!entry?.icon?.startsWith("data:image/png;base64,")) errors.push("Marketplace icon must be an embedded PNG data URI");

const iconAsset = await readFile(resolve(root, "plugins/deepseek-web-search/assets/icon.png"));
const embeddedIcon = Buffer.from(entry?.icon?.split(",", 2)[1] ?? "", "base64");
if (iconAsset.subarray(1, 4).toString("ascii") !== "PNG") errors.push("Plugin icon asset must be a PNG");
if (embeddedIcon.subarray(1, 4).toString("ascii") !== "PNG") errors.push("Embedded marketplace icon must decode to a PNG");
if (plugin.userConfig?.model?.default !== "deepseek-v4-flash") errors.push("Unexpected default model");
if (plugin.userConfig?.web_search_version?.default !== "web_search_20250305") errors.push("Unexpected default web search version");
if (plugin.userConfig?.base_url?.default !== "https://api.deepseek.com/anthropic") errors.push("Unexpected default base URL");
if (plugin.userConfig?.api_key?.sensitive === true) errors.push("API token must remain editable in the ZCode plugin page");
if (plugin.userConfig?.api_key?.required !== true) errors.push("API token must remain required");
if (!mcp.mcpServers?.["deepseek-web-search"]) errors.push("MCP server declaration is missing");
if (packageJson.engines?.node !== ">=24") errors.push("Repository must require Node.js 24 or newer");

const serialized = JSON.stringify({ marketplace, plugin, mcp });
if (/sk-[A-Za-z0-9]/.test(serialized)) errors.push("A token-like value was committed to configuration");

const startScript = await readFile(resolve(root, "plugins/deepseek-web-search/scripts/start.mjs"), "utf8");
if (startScript.includes("@kyaulabs/deepseek-websearch")) errors.push("Runtime must not download the upstream MCP package");
if (!startScript.includes("MINIMUM_NODE_MAJOR = 24")) errors.push("MCP entrypoint must enforce Node.js 24 or newer");

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Marketplace, plugin manifest, and MCP configuration are valid.");
