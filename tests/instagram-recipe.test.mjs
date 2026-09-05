import assert from "node:assert/strict";
import test from "node:test";
import { instagramUrl, parseInstagramCaption } from "../db/instagram-recipe.mjs";

test("turns a labelled Indian recipe caption into a reviewable recipe draft", () => {
  const sourceUrl = instagramUrl("https://instagram.com/reel/Paneer_123/?utm_source=share");
  const { draft, warnings } = parseInstagramCaption(`Paneer Tikka Wrap
A quick high-protein dinner.
Ingredients:
200 g paneer
1 tsp chilli powder
2 rotis
Method:
1. Marinate the paneer.
2. Grill until golden.
3. Roll into the rotis.`, sourceUrl);

  assert.equal(sourceUrl, "https://www.instagram.com/reel/Paneer_123/");
  assert.equal(draft.title, "Paneer Tikka Wrap");
  assert.deepEqual(draft.ingredients, ["200 g paneer", "1 tsp chilli powder", "2 rotis"]);
  assert.equal(draft.steps.length, 3);
  assert.deepEqual(draft.mealTypes, ["Dinner"]);
  assert.equal(draft.cuisine, "Indian");
  assert.equal(draft.sourceUrl, sourceUrl);
  assert.deepEqual(warnings, []);
});

test("blocks non-post and non-Instagram URLs", () => {
  assert.throws(() => instagramUrl("https://example.com/reel/test"), /Instagram/i);
  assert.throws(() => instagramUrl("https://www.instagram.com/kitchenkatha"), /post or reel/i);
});
