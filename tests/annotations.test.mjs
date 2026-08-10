import assert from "node:assert/strict";
import test from "node:test";

import { WEB_SEARCH_ANNOTATIONS } from "../plugins/deepseek-web-search/scripts/annotations.mjs";

test("declares standard read-only web-search annotations", () => {
  assert.deepEqual(WEB_SEARCH_ANNOTATIONS, {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  });
});
