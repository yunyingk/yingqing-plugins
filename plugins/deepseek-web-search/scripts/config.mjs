const PLACEHOLDER_PREFIX = "${user_config.";

function usable(value) {
  return typeof value === "string"
    && value.trim().length > 0
    && !value.includes(PLACEHOLDER_PREFIX);
}

function firstUsable(...values) {
  return values.find(usable)?.trim();
}

export function resolveConfig(env = process.env) {
  return {
    apiKey: firstUsable(
      env.DEEPSEEK_PLUGIN_API_KEY,
      env.DEEPSEEK_API_KEY,
      env.WEBSEARCH_API_KEY,
    ),
    baseUrl: firstUsable(
      env.DEEPSEEK_PLUGIN_BASE_URL,
      env.WEBSEARCH_BASE_URL,
    ) ?? "https://api.deepseek.com/anthropic",
    model: firstUsable(
      env.DEEPSEEK_PLUGIN_MODEL,
      env.WEBSEARCH_MODEL,
    ) ?? "deepseek-v4-flash",
    thinking: firstUsable(
      env.DEEPSEEK_PLUGIN_THINKING,
      env.WEBSEARCH_THINKING,
    ) ?? "enabled",
    maxTokens: firstUsable(
      env.DEEPSEEK_PLUGIN_MAX_TOKENS,
      env.WEBSEARCH_MAX_TOKENS,
    ) ?? "32768",
  };
}

export function toServerEnv(config, env = process.env) {
  return {
    ...env,
    DEEPSEEK_API_KEY: config.apiKey,
    WEBSEARCH_BASE_URL: config.baseUrl,
    WEBSEARCH_MODEL: config.model,
    WEBSEARCH_THINKING: config.thinking,
    WEBSEARCH_MAX_TOKENS: config.maxTokens,
  };
}
