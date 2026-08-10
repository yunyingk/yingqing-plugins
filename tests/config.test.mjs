import assert from "node:assert/strict";
import test from "node:test";
import { resolveConfig } from "../plugins/deepseek-web-search/scripts/config.mjs";

test("uses documented defaults", () => {
  const config = resolveConfig({ DEEPSEEK_API_KEY: "test-token" });

  assert.equal(config.apiKey, "test-token");
  assert.equal(config.baseUrl, "https://api.deepseek.com/anthropic");
  assert.equal(config.model, "deepseek-v4-flash");
  assert.equal(config.thinking, "enabled");
  assert.equal(config.maxTokens, "32768");
});

test("plugin settings override environment fallbacks", () => {
  const config = resolveConfig({
    DEEPSEEK_PLUGIN_API_KEY: "plugin-token",
    DEEPSEEK_API_KEY: "environment-token",
    DEEPSEEK_PLUGIN_BASE_URL: "https://proxy.example/anthropic",
    WEBSEARCH_BASE_URL: "https://fallback.example/anthropic",
    DEEPSEEK_PLUGIN_MODEL: "custom-search-model",
  });

  assert.equal(config.apiKey, "plugin-token");
  assert.equal(config.baseUrl, "https://proxy.example/anthropic");
  assert.equal(config.model, "custom-search-model");
});

test("unresolved userConfig placeholders fall back to environment", () => {
  const config = resolveConfig({
    DEEPSEEK_PLUGIN_API_KEY: "${user_config.api_key}",
    DEEPSEEK_PLUGIN_BASE_URL: "${user_config.base_url}",
    DEEPSEEK_API_KEY: "environment-token",
    WEBSEARCH_BASE_URL: "https://proxy.example/anthropic",
  });

  assert.equal(config.apiKey, "environment-token");
  assert.equal(config.baseUrl, "https://proxy.example/anthropic");
});

test("rejects max_tokens outside the supported range", () => {
  assert.throws(
    () => resolveConfig({
      DEEPSEEK_API_KEY: "token",
      WEBSEARCH_MAX_TOKENS: "100",
    }),
    /between 1024 and 131072/,
  );
});
