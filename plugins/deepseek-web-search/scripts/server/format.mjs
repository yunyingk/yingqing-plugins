// Adapted from kyaulabs/deepseek-websearch-mcp (MIT).

import { SearchErrorCode } from "./errors.mjs";

export function formatResults(query, response) {
  const { results, textAnswer } = response;

  if (results.length === 0 && !textAnswer) {
    return `Web search for **"${query}"** returned no results. Try rephrasing with more specific keywords.`;
  }

  const lines = [];
  if (textAnswer) {
    if (textAnswer.startsWith("##") || textAnswer.startsWith("# ")) {
      lines.push(textAnswer);
    } else {
      lines.push("## Search Results Summary", "", textAnswer);
    }
  }

  if (results.length > 0) {
    if (textAnswer) lines.push("", "---");
    lines.push("", `### Sources (${results.length}):`, "");
    for (const [index, result] of results.entries()) {
      lines.push(`${index + 1}. [${result.title}](${result.url})`);
      if (result.pageAge) lines.push(`   - *${result.pageAge}*`);
    }
  }

  return lines.join("\n");
}

export function formatError(error) {
  if (error.code === SearchErrorCode.RATE_LIMITED) {
    return `Rate limited by DeepSeek API (HTTP ${error.statusCode ?? 429}). Wait a moment and try again.`;
  }
  return `Search failed [${error.code ?? "UNKNOWN"}]${error.statusCode ? ` (HTTP ${error.statusCode})` : ""}: ${error.message}`;
}
