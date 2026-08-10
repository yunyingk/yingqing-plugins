const CHAT_COMPLETIONS_SUFFIX = "/v1/chat/completions";

export function normalizeVisionBaseUrl(value) {
  const input = String(value ?? "").trim().replace(/\/+$/, "");
  if (!input) return "https://api.openai.com/v1";
  if (input.endsWith(CHAT_COMPLETIONS_SUFFIX)) {
    return input.slice(0, -"/chat/completions".length);
  }
  if (input.endsWith("/chat/completions")) {
    return input.slice(0, -"/chat/completions".length);
  }
  if (input.endsWith("/v1")) return input;
  return `${input}/v1`;
}
