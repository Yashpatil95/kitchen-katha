import assert from "node:assert/strict";
import test from "node:test";
import {
  captionFromInstagramHtml,
  fetchInstagramCaption,
  importInstagramRecipe,
  instagramUrl,
  parseInstagramCaption,
} from "../db/instagram-recipe.mjs";

const sourceUrl = "https://www.instagram.com/reel/Paneer_123/";
const completeCaption = `Paneer Tikka Wrap 🌯
A quick high-protein Indian dinner.

Ingredients for 2:
• 200 g paneer
• 1 tsp chilli powder
• 2 rotis

How to make:
1. Marinate the paneer.
2. Grill until golden.
3. Roll into the rotis.

#paneer #dinner`;

test("turns a realistic multi-section Indian caption into a truthful structured draft", () => {
  const { draft, missing, warnings } = parseInstagramCaption(completeCaption, sourceUrl);

  assert.equal(draft.title, "Paneer Tikka Wrap 🌯");
  assert.deepEqual(draft.ingredients, ["200 g paneer", "1 tsp chilli powder", "2 rotis"]);
  assert.deepEqual(draft.steps, ["Marinate the paneer.", "Grill until golden.", "Roll into the rotis."]);
  assert.deepEqual(draft.mealTypes, ["Dinner"]);
  assert.equal(draft.cuisine, "Indian");
  assert.equal(draft.servings, 2);
  assert.equal(draft.diet, "Unknown");
  assert.equal(draft.prepMinutes, 0);
  assert.equal(draft.calories, null);
  assert.equal(draft.sourceUrl, sourceUrl);
  assert.deepEqual(missing, []);
  assert.deepEqual(warnings, []);
});

test("supports inline ingredient and numbered method sections", () => {
  const { draft, missing } = parseInstagramCaption(`Masala Chai
Ingredients: 1 cup milk; 1 cup water; 2 tsp tea
Preparation: 1. Boil the water 2. Add tea and milk 3. Strain and serve`, sourceUrl);

  assert.deepEqual(draft.ingredients, ["1 cup milk", "1 cup water", "2 tsp tea"]);
  assert.deepEqual(draft.steps, ["Boil the water", "Add tea and milk", "Strain and serve"]);
  assert.deepEqual(missing, []);
});

test("accepts dash-suffixed headings and drops social tag blocks", () => {
  const { draft, missing } = parseInstagramCaption(`Afghani Chicken
ingredients
- 300 g chicken
- 1/2 cup curd
method-
- Marinate for 20 minutes.
- Cook until golden.
[chicken, cooking, recipe, food reels]
#food #reels View all comments`, sourceUrl);

  assert.deepEqual(draft.ingredients, ["300 g chicken", "1/2 cup curd"]);
  assert.deepEqual(draft.steps, ["Marinate for 20 minutes.", "Cook until golden."]);
  assert.deepEqual(missing, []);
});

test("does not label meat recipes vegetarian or invent missing fields", () => {
  const { draft } = parseInstagramCaption(`Pepper Beef
Ingredients:
500 g beef
Method:
1. Sear until cooked.`, sourceUrl);

  assert.equal(draft.diet, "Other");
  assert.equal(draft.servings, 0);
  assert.equal(draft.spiceLevel, -1);
  assert.deepEqual(draft.mealTypes, ["Other"]);
});

test("blocks invalid links and normalises current Instagram share-link shapes", () => {
  assert.throws(() => instagramUrl("https://example.com/reel/test"), /Instagram/i);
  assert.throws(() => instagramUrl("https://www.instagram.com/kitchenkatha"), /post or reel/i);
  assert.equal(
    instagramUrl("https://www.instagram.com/kitchen.katha/reels/ABC_123/?igsh=test"),
    "https://www.instagram.com/reel/ABC_123/",
  );
});

test("extracts captions when Instagram adds extra HTML classes", () => {
  const html = `<div data-id="x" class="Embed Caption is-ready"><a class="profile CaptionUsername verified">cook</a><br /><br />Paneer Tikka<br />Ingredients:<br />200g paneer &amp; spices<br />Method:<br />1. Grill it.</div>`;
  assert.equal(
    captionFromInstagramHtml(html),
    "Paneer Tikka\nIngredients:\n200g paneer & spices\nMethod:\n1. Grill it.",
  );
});

test("retrieves a public caption with bounded manual-redirect requests", async () => {
  const calls = [];
  const caption = await fetchInstagramCaption(sourceUrl, async (url, options) => {
    calls.push({ url, options });
    return new Response(`<div class="Caption extra">${completeCaption.replaceAll("\n", "<br>")}</div>`);
  });

  assert.match(caption, /Ingredients for 2/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${sourceUrl}embed/captioned/`);
  assert.equal(calls[0].options.redirect, "manual");
});

test("reports gated posts, timeouts and oversized responses separately", async () => {
  await assert.rejects(
    fetchInstagramCaption(sourceUrl, async () => new Response("Forbidden", { status: 403 })),
    (error) => error.code === "caption_unavailable" && error.canPasteCaption,
  );
  await assert.rejects(
    fetchInstagramCaption(sourceUrl, async () => { throw new DOMException("Timed out", "TimeoutError"); }),
    (error) => error.code === "upstream_timeout" && error.status === 504,
  );
  await assert.rejects(
    fetchInstagramCaption(sourceUrl, async () => new Response("", { headers: { "content-length": "1000001" } })),
    (error) => error.code === "response_too_large" && error.status === 502,
  );
});

test("returns an editable draft instead of saving an incomplete caption", async () => {
  let saves = 0;
  await assert.rejects(
    importInstagramRecipe({
      url: sourceUrl,
      caption: "Coconut chutney\nIngredients:\n1 cup coconut",
      findExisting: async () => null,
      saveRecipe: async () => { saves += 1; },
    }),
    (error) => error.code === "incomplete_caption"
      && error.missing.includes("steps")
      && error.draft.ingredients[0] === "1 cup coconut",
  );
  assert.equal(saves, 0);
});

test("does not retrieve or save a duplicate source link", async () => {
  const existing = { id: 7, title: "Already there" };
  const result = await importInstagramRecipe({
    url: sourceUrl,
    fetcher: async () => assert.fail("duplicate should not be retrieved"),
    findExisting: async () => existing,
    saveRecipe: async () => assert.fail("duplicate should not be saved"),
  });
  assert.deepEqual(result, { recipe: existing, alreadySaved: true });
});

test("surfaces storage failures without claiming the caption failed", async () => {
  await assert.rejects(
    importInstagramRecipe({
      url: sourceUrl,
      caption: completeCaption,
      findExisting: async () => null,
      saveRecipe: async () => { throw new Error("database offline"); },
    }),
    (error) => error.code === "storage_error" && error.status === 500 && error.stage === "save",
  );
});
