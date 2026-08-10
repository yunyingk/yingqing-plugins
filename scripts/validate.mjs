import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");

async function json(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

const marketplace = await json(".claude-plugin/marketplace.json");
const searchPlugin = await json("plugins/deepseek-web-search/.claude-plugin/plugin.json");
const searchMcp = await json("plugins/deepseek-web-search/.mcp.json");
const visionPlugin = await json("plugins/vision-analyzer/.claude-plugin/plugin.json");
const visionMcp = await json("plugins/vision-analyzer/.mcp.json");
const packageJson = await json("package.json");

const errors = [];
const searchEntry = marketplace.plugins?.find((item) => item.name === searchPlugin.name);
const visionEntry = marketplace.plugins?.find((item) => item.name === visionPlugin.name);
const xiaohongshuEntry = marketplace.plugins?.find((item) => item.name === "xiaohongshu-skills");

if (marketplace.name !== "yingqing-plugins") errors.push("Unexpected marketplace name");
if (!searchEntry) errors.push("Search plugin is missing from marketplace.json");
if (!visionEntry) errors.push("Vision plugin is missing from marketplace.json");
if (!xiaohongshuEntry) errors.push("Xiaohongshu plugin is missing from marketplace.json");
if (searchEntry?.source !== "./plugins/deepseek-web-search") errors.push("Unexpected search plugin source");
if (visionEntry?.source !== "./plugins/vision-analyzer") errors.push("Unexpected vision plugin source");
if (searchEntry?.version !== searchPlugin.version) errors.push("Search marketplace and plugin versions differ");
if (visionEntry?.version !== visionPlugin.version) errors.push("Vision marketplace and plugin versions differ");
if (xiaohongshuEntry?.source?.source !== "github") errors.push("Xiaohongshu plugin must use an external GitHub source");
if (xiaohongshuEntry?.source?.repo !== "autoclaw-cc/xiaohongshu-skills") errors.push("Unexpected Xiaohongshu plugin repository");
if (!/^[0-9a-f]{40}$/.test(xiaohongshuEntry?.source?.sha ?? "")) errors.push("Xiaohongshu plugin source must be pinned to a full commit SHA");
if (xiaohongshuEntry?.skills !== "./skills") errors.push("Xiaohongshu plugin must expose the upstream skills directory");
if (xiaohongshuEntry?.strict !== false) errors.push("Xiaohongshu plugin must be defined by the marketplace entry");
if (xiaohongshuEntry?.license !== "MIT") errors.push("Unexpected Xiaohongshu plugin license");
if (!searchEntry?.icon?.startsWith("data:image/png;base64,")) errors.push("Marketplace icon must be an embedded PNG data URI");

const iconAsset = await readFile(resolve(root, "plugins/deepseek-web-search/assets/icon.png"));
const embeddedIcon = Buffer.from(searchEntry?.icon?.split(",", 2)[1] ?? "", "base64");
if (iconAsset.subarray(1, 4).toString("ascii") !== "PNG") errors.push("Plugin icon asset must be a PNG");
if (embeddedIcon.subarray(1, 4).toString("ascii") !== "PNG") errors.push("Embedded marketplace icon must decode to a PNG");
if (searchPlugin.userConfig?.model?.default !== "deepseek-v4-flash") errors.push("Unexpected default search model");
if (searchPlugin.userConfig?.web_search_version?.default !== "web_search_20250305") errors.push("Unexpected default web search version");
if (searchPlugin.userConfig?.base_url?.default !== "https://api.deepseek.com/anthropic") errors.push("Unexpected default search base URL");
if (searchPlugin.userConfig?.api_key?.sensitive === true) errors.push("Search API token must remain editable in the ZCode plugin page");
if (searchPlugin.userConfig?.api_key?.required !== true) errors.push("Search API token must remain required");
if (!searchMcp.mcpServers?.["deepseek-web-search"]) errors.push("Search MCP server declaration is missing");

if (visionPlugin.version !== "0.2.1") errors.push("Unexpected vision plugin version");
if (visionPlugin.userConfig?.base_url?.default !== "https://api.openai.com") errors.push("Unexpected default vision base URL");
if (!visionPlugin.userConfig?.base_url?.title?.includes("/v1/chat/completions")) errors.push("Vision Base URL field must disclose the appended endpoint");
if (visionPlugin.userConfig?.model?.default !== "gpt-4o") errors.push("Unexpected default vision model");
if (visionPlugin.userConfig?.show_usage?.default !== false) errors.push("Vision usage metadata must be hidden by default");
if (visionPlugin.userConfig?.api_key?.sensitive === true) errors.push("Vision API token must remain editable in the ZCode plugin page");
if (visionPlugin.userConfig?.api_key?.required !== true) errors.push("Vision API token must remain required");
if (!visionMcp.mcpServers?.["vision-analyzer"]) errors.push("Vision MCP server declaration is missing");
if (visionMcp.mcpServers?.["vision-analyzer"]?.timeoutMs !== 120000) errors.push("Vision MCP timeout must support long-running analysis");
if (searchMcp.mcpServers?.["deepseek-web-search"]?.timeoutMs !== 120000) errors.push("Search MCP timeout must support long-running searches");
if (packageJson.engines?.node !== ">=24") errors.push("Repository must require Node.js 24 or newer");
if (packageJson.version !== "0.5.0") errors.push("Unexpected marketplace package version");

const serialized = JSON.stringify({ marketplace, searchPlugin, searchMcp, visionPlugin, visionMcp });
if (/sk-[A-Za-z0-9]/.test(serialized)) errors.push("A token-like value was committed to configuration");

const startScript = await readFile(resolve(root, "plugins/deepseek-web-search/scripts/start.mjs"), "utf8");
const skillSource = await readFile(resolve(root, "plugins/deepseek-web-search/skills/deepseek-web-search/SKILL.md"), "utf8");
const visionStartScript = await readFile(resolve(root, "plugins/vision-analyzer/scripts/start.mjs"), "utf8");
const visionSkillSource = await readFile(resolve(root, "plugins/vision-analyzer/skills/vision-analyzer/SKILL.md"), "utf8");
const searchSource = await readFile(resolve(root, "plugins/deepseek-web-search/scripts/server/search.mjs"), "utf8");
const searchProtocol = await readFile(resolve(root, "plugins/deepseek-web-search/scripts/server/protocol.mjs"), "utf8");
const visionSource = await readFile(resolve(root, "plugins/vision-analyzer/scripts/server/vision.mjs"), "utf8");
const visionProtocol = await readFile(resolve(root, "plugins/vision-analyzer/scripts/server/protocol.mjs"), "utf8");
if (startScript.includes("@kyaulabs/deepseek-websearch")) errors.push("Runtime must not download the upstream MCP package");
if (!startScript.includes("MINIMUM_NODE_MAJOR = 24")) errors.push("MCP entrypoint must enforce Node.js 24 or newer");
const skillDescription = skillSource.match(/^description:\s*(.+)$/m)?.[1] ?? "";
if (/DeepSeek|Anthropic|Messages API/i.test(skillDescription)) errors.push("Skill trigger description must remain provider-agnostic");
if (!visionStartScript.includes("MINIMUM_NODE_MAJOR = 24")) errors.push("Vision entrypoint must enforce Node.js 24 or newer");
if (visionStartScript.includes("npx") || visionStartScript.includes("@winton979/vision-mcp")) errors.push("Vision runtime must use locally maintained source");
if (!searchSource.includes("stream: true")) errors.push("Search API request must use SSE streaming");
if (!visionSource.includes("stream: true")) errors.push("Vision API request must use SSE streaming");
if (!searchProtocol.includes("notifications/progress") || !visionProtocol.includes("notifications/progress")) errors.push("Both MCP tools must support progress heartbeats");
const visionSkillDescription = visionSkillSource.match(/^description:\s*(.+)$/m)?.[1] ?? "";
if (/OpenAI|Chat Completions|winton979/i.test(visionSkillDescription)) errors.push("Vision skill trigger description must remain provider-agnostic");

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Marketplace and all plugin configurations are valid.");
