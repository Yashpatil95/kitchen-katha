import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  captionFromInstagramHtml,
  fetchInstagramCaption,
  InstagramImportError,
  importInstagramRecipe,
  instagramUrl,
  parseInstagramCaption,
} from "../db/instagram-recipe.mjs";

const sourceUrl = "https://www.instagram.com/reel/Paneer_123/";
const journalSource = readFileSync(new URL("../app/recipe-journal.tsx", import.meta.url), "utf8");
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

test("adds Instagram provenance to the shared recipe-text result", () => {
  const { draft, missing, warnings } = parseInstagramCaption(completeCaption, sourceUrl);

  assert.equal(draft.title, "Paneer Tikka Wrap 🌯");
  assert.equal(draft.sourceUrl, sourceUrl);
  assert.match(draft.notes, /Instagram/);
  assert.deepEqual(missing, []);
  assert.deepEqual(warnings, []);
});

test("keeps generic text failures inside the existing Instagram error contract", () => {
  assert.throws(
    () => parseInstagramCaption("  \n#food", sourceUrl),
    (error) => error instanceof InstagramImportError && error.code === "empty_caption",
  );
  assert.throws(
    () => parseInstagramCaption("x".repeat(100_001), sourceUrl),
    (error) => error instanceof InstagramImportError && error.code === "caption_too_large" && error.status === 413,
  );
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

test("accepts bounded transcript, image text and comments when the public caption is unavailable", async () => {
  let saved;
  const result = await importInstagramRecipe({
    url: sourceUrl,
    transcript: `Narrated coconut chutney
Ingredients:
1 cup coconut`,
    imageText: `Method card
Method:
1. Blend until smooth.`,
    commentText: "Toast the coconut first for a nuttier flavour.",
    fetcher: async () => new Response("Forbidden", { status: 403 }),
    findExisting: async () => null,
    saveRecipe: async (draft) => {
      saved = draft;
      return { recipe: { id: 8, ...draft }, alreadySaved: false };
    },
  });

  assert.equal(result.recipe.id, 8);
  assert.deepEqual(saved.ingredients, ["1 cup coconut"]);
  assert.deepEqual(saved.steps, ["Blend until smooth."]);
  assert.match(saved.notes, /Comments \(unverified\):/);
  assert.match(saved.notes, /Toast the coconut first/);
});

test("wires a bounded manual narration transcript into the import request", () => {
  assert.match(journalSource, /<textarea name="instagramTranscript"[^>]*maxLength=\{100000\}/);
  assert.match(journalSource, /JSON\.stringify\(\{[^}]*transcript/);
  assert.match(journalSource, /Paste the caption, a narration transcript, or text found in images\./);
  assert.match(journalSource, /does not transcribe the video or use API credits/i);
});

test("wires bounded manual image text and unverified comments into the import request", () => {
  assert.match(journalSource, /<textarea name="instagramImageText"[^>]*maxLength=\{50000\}/);
  assert.match(journalSource, /<textarea rows=\{4\} maxLength=\{1500\} onChange=\{updatePastedComments\}/);
  assert.match(journalSource, /type="hidden" name="instagramComments" value=\{selectedComments/);
  assert.match(journalSource, /Select useful comments/);
  assert.match(journalSource, /JSON\.stringify\(\{[^}]*imageText, commentText/);
  assert.match(journalSource, /does not inspect the images or use OCR credits/i);
  assert.match(journalSource, /Comments \(unverified\).*never become ingredients or method steps/i);
});

test("labels local media inputs with the owner permission boundary", () => {
  assert.match(journalSource, /Upload media you are allowed to use/);
  assert.match(journalSource, /created or have permission to process/);
  assert.match(journalSource, /upload saved narration audio\/video/i);
  assert.match(journalSource, /Upload a saved Reel video for local thumbnails/);
  assert.match(journalSource, /upload saved screenshots or images/i);
  assert.match(journalSource, /never asks for Instagram passwords or downloads private posts/);
});

test("rejects invalid or oversized optional evidence before external work", async () => {
  const base = {
    url: sourceUrl,
    fetcher: async () => assert.fail("invalid evidence must not trigger retrieval"),
    findExisting: async () => assert.fail("invalid evidence must not reach storage"),
    saveRecipe: async () => assert.fail("invalid evidence must not be saved"),
  };

  await assert.rejects(
    importInstagramRecipe({ ...base, transcript: { text: "not a string" } }),
    (error) => error.code === "invalid_evidence" && error.status === 400 && error.stage === "validate",
  );
  for (const evidence of [
    { transcript: "x".repeat(100_001) },
    { imageText: "x".repeat(50_001) },
    { commentText: "x".repeat(1_501) },
  ]) {
    await assert.rejects(
      importInstagramRecipe({ ...base, ...evidence }),
      (error) => error.code === "evidence_too_large" && error.status === 413 && error.stage === "validate",
    );
  }
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
