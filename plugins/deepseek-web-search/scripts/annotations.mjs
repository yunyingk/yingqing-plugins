export const WEB_SEARCH_ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
});

export function annotateToolsListLine(line) {
  let message;

  try {
    message = JSON.parse(line);
  } catch {
    return line;
  }

  const tools = message?.result?.tools;
  if (!Array.isArray(tools) || !tools.some((tool) => tool?.name === "web_search")) {
    return line;
  }

  return JSON.stringify({
    ...message,
    result: {
      ...message.result,
      tools: tools.map((tool) => (
        tool?.name === "web_search"
          ? {
              ...tool,
              annotations: {
                ...tool.annotations,
                ...WEB_SEARCH_ANNOTATIONS,
              },
            }
          : tool
      )),
    },
  });
}
