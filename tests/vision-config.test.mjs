import assert from "node:assert/strict";
import test from "node:test";
import { normalizeVisionBaseUrl, parseBoolean } from "../plugins/vision-analyzer/scripts/config.mjs";

test("normalizes a service root to the OpenAI-compatible /v1 base", () => {
  assert.equal(normalizeVisionBaseUrl("https://api.openai.com"), "https://api.openai.com/v1");
  assert.equal(normalizeVisionBaseUrl("https://example.com/"), "https://example.com/v1");
});

test("keeps usage metadata disabled unless explicitly enabled", () => {
  assert.equal(parseBoolean(undefined, false), false);
  assert.equal(parseBoolean("false", true), false);
  assert.equal(parseBoolean("true", false), true);
});

test("accepts existing /v1 and full chat completions URLs", () => {
  assert.equal(normalizeVisionBaseUrl("https://example.com/v1"), "https://example.com/v1");
  assert.equal(
    normalizeVisionBaseUrl("https://example.com/v1/chat/completions"),
    "https://example.com/v1",
  );
});
