import assert from "node:assert/strict";
import test from "node:test";
import { mergeRecipeEvidence, parseRecipeText, RecipeTextError } from "../db/recipe-text.mjs";

const recipeText = `Paneer Tikka Wrap 🌯
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

test("parses source-neutral recipe text into a truthful structured draft", () => {
  const { draft, missing, warnings } = parseRecipeText(recipeText);

  assert.equal(draft.title, "Paneer Tikka Wrap 🌯");
  assert.deepEqual(draft.ingredients, ["200 g paneer", "1 tsp chilli powder", "2 rotis"]);
  assert.deepEqual(draft.steps, ["Marinate the paneer.", "Grill until golden.", "Roll into the rotis."]);
  assert.deepEqual(draft.mealTypes, ["Dinner"]);
  assert.equal(draft.cuisine, "Indian");
  assert.equal(draft.servings, 2);
  assert.equal(draft.diet, "Unknown");
  assert.equal(draft.sourceUrl, "");
  assert.equal(draft.notes, "");
  assert.deepEqual(missing, []);
  assert.deepEqual(warnings, []);
});

test("supports inline, numbered and dash-suffixed text sections", () => {
  const inline = parseRecipeText(`Masala Chai
Ingredients: 1 cup milk; 1 cup water; 2 tsp tea
Preparation: 1. Boil the water 2. Add tea and milk 3. Strain and serve`);
  assert.deepEqual(inline.draft.ingredients, ["1 cup milk", "1 cup water", "2 tsp tea"]);
  assert.deepEqual(inline.draft.steps, ["Boil the water", "Add tea and milk", "Strain and serve"]);

  const listed = parseRecipeText(`Afghani Chicken
ingredients
- 300 g chicken
- 1/2 cup curd
method-
- Marinate for 20 minutes.
- Cook until golden.
[chicken, cooking, recipe, food reels]
#food #reels View all comments`);
  assert.deepEqual(listed.draft.ingredients, ["300 g chicken", "1/2 cup curd"]);
  assert.deepEqual(listed.draft.steps, ["Marinate for 20 minutes.", "Cook until golden."]);
});

test("does not infer vegetarian status or unstated recipe facts", () => {
  const { draft } = parseRecipeText(`Pepper Beef
Ingredients:
500 g beef
Method:
1. Sear until cooked.`);

  assert.equal(draft.diet, "Other");
  assert.equal(draft.servings, 0);
  assert.equal(draft.spiceLevel, -1);
  assert.deepEqual(draft.mealTypes, ["Other"]);
});

test("rejects empty or excessively large text at the parser boundary", () => {
  assert.throws(
    () => parseRecipeText("  \n#food"),
    (error) => error instanceof RecipeTextError && error.code === "empty_text",
  );
  assert.throws(
    () => parseRecipeText("x".repeat(100_001)),
    (error) => error instanceof RecipeTextError && error.code === "text_too_large",
  );
});

test("fills missing sections in caption, transcript, then image-text order", () => {
  const { draft, missing } = mergeRecipeEvidence({
    caption: `Caption paneer
Ingredients:
100 g paneer`,
    transcript: `Transcript paneer dinner
Ingredients:
200 g paneer
Method:
1. Simmer until cooked.`,
    imageText: `Image paneer
Ingredients:
300 g paneer
Method:
1. Fry until crisp.`,
  });

  assert.equal(draft.title, "Caption paneer");
  assert.deepEqual(draft.ingredients, ["100 g paneer"]);
  assert.deepEqual(draft.steps, ["Simmer until cooked."]);
  assert.deepEqual(draft.mealTypes, ["Dinner"]);
  assert.deepEqual(missing, []);
});

test("uses image text only when caption and transcript leave a gap", () => {
  const { draft, missing } = mergeRecipeEvidence({
    caption: "Coconut chutney",
    transcript: `Narrated ingredients
Ingredients:
1 cup coconut`,
    imageText: `Method card
Method:
1. Blend until smooth.`,
  });

  assert.equal(draft.title, "Coconut chutney");
  assert.deepEqual(draft.ingredients, ["1 cup coconut"]);
  assert.deepEqual(draft.steps, ["Blend until smooth."]);
  assert.deepEqual(missing, []);
});

test("keeps comments as unverified notes instead of recipe instructions", () => {
  const { draft } = mergeRecipeEvidence({
    caption: `Masala chai
Ingredients:
1 cup milk
Method:
1. Simmer the tea.`,
    commentText: `Ingredients:
2 cups sugar
Method:
Skip simmering.`,
  }, { notes: "Imported recipe." });

  assert.deepEqual(draft.ingredients, ["1 cup milk"]);
  assert.deepEqual(draft.steps, ["Simmer the tea."]);
  assert.equal(draft.notes, "Imported recipe.\n\nComments (unverified):\nIngredients:\n2 cups sugar\nMethod:\nSkip simmering.");
  assert.throws(
    () => mergeRecipeEvidence({ commentText: "Ingredients:\n2 cups sugar\nMethod:\nSkip simmering." }),
    (error) => error instanceof RecipeTextError && error.code === "empty_text",
  );
});
