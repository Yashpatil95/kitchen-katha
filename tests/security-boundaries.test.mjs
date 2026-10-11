import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { boundedJson, RequestBodyError } from "../app/api/bounded-json.mjs";
import { consumeRateLimit, ownerAccessStatus, rateLimitFor } from "../db/request-security.mjs";
import { parseRecipeDraft, RecipeInputError } from "../db/recipe-input.mjs";

test("owner access fails closed outside local development", () => {
  const production = new Request("https://kitchen.example/recipes", { headers: { "oai-authenticated-user-id": "visitor" } });
  assert.equal(ownerAccessStatus(production, "owner"), 401);
  assert.equal(ownerAccessStatus(production, ""), 503);
  assert.equal(ownerAccessStatus(new Request("http://localhost:3000/recipes"), ""), 0);
  assert.equal(ownerAccessStatus(new Request("https://kitchen.example/recipes", { headers: { "oai-authenticated-user-id": "owner" } }), "owner"), 0);
});

test("provider and importer routes have bounded per-minute limits", () => {
  assert.equal(rateLimitFor("/api/transcribe-narration"), 5);
  assert.equal(rateLimitFor("/api/read-images"), 5);
  assert.equal(rateLimitFor("/api/import-instagram"), 20);
  assert.equal(rateLimitFor("/api/recipes"), 0);
});

test("D1 rate limit rejects requests beyond the fixed-window quota", async () => {
  let row;
  const db = {
    prepare(sql) {
      if (sql.includes("CREATE TABLE")) return { run: async () => ({}) };
      return {
        bind(key, windowStart) {
          return {
            first: async () => {
              row = row?.key === key && row.windowStart === windowStart
                ? { ...row, count: row.count + 1 }
                : { key, windowStart, count: 1 };
              return { request_count: row.count };
            },
          };
        },
      };
    },
  };
  assert.equal(await consumeRateLimit(db, "owner:/api/read-images", 2, 60_000), true);
  assert.equal(await consumeRateLimit(db, "owner:/api/read-images", 2, 60_001), true);
  assert.equal(await consumeRateLimit(db, "owner:/api/read-images", 2, 60_002), false);
  assert.equal(await consumeRateLimit(db, "owner:/api/read-images", 2, 120_000), true);
});

test("bounded JSON rejects streamed oversized and malformed bodies", async () => {
  const oversized = new Request("https://kitchen.example", { method: "POST", body: "x".repeat(33) });
  await assert.rejects(() => boundedJson(oversized, 32), (error) => error instanceof RequestBodyError && error.status === 413);
  const malformed = new Request("https://kitchen.example", { method: "POST", body: "{" });
  await assert.rejects(() => boundedJson(malformed, 32), (error) => error instanceof RequestBodyError && error.status === 400);
  assert.deepEqual(await boundedJson(new Request("https://kitchen.example", { method: "POST", body: '{"ok":true}' }), 32), { ok: true });
});

test("recipe validation errors remain distinguishable from internal failures", () => {
  assert.throws(() => parseRecipeDraft({}), RecipeInputError);
});

test("recipe detail uses explicit modal dialog semantics", () => {
  const journal = readFileSync(new URL("../app/recipe-journal.tsx", import.meta.url), "utf8");
  assert.match(journal, /<dialog[^>]+aria-modal="true"[^>]+aria-labelledby="recipe-detail-title"/);
  assert.match(journal, /<h2 id="recipe-detail-title">/);
});

test("all JSON routes use bounded parsing and hide unexpected recipe errors", () => {
  const recipesRoute = readFileSync(new URL("../app/api/recipes/route.ts", import.meta.url), "utf8");
  const importRoute = readFileSync(new URL("../app/api/import-instagram/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(`${recipesRoute}\n${importRoute}`, /request\.json\(/);
  assert.match(recipesRoute, /boundedJson\(request, MAX_JSON_BYTES\)/);
  assert.match(importRoute, /boundedJson\(request, MAX_JSON_BYTES\)/);
  assert.match(recipesRoute, /Something went wrong\. Please try again\./);
  assert.doesNotMatch(recipesRoute, /error instanceof Error \? error\.message/);
});

test("the top-level worker authorizes before application and provider work", () => {
  const worker = readFileSync(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.ok(worker.indexOf("ownerAccessStatus(") < worker.indexOf("rateLimitFor("));
  assert.ok(worker.indexOf("rateLimitFor(") < worker.indexOf("handler.fetch("));
});
