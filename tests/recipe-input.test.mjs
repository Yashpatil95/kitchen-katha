import assert from "node:assert/strict";
import test from "node:test";
import { parseRecipeDraft } from "../db/recipe-input.mjs";

test("normalises a recipe at the save boundary", () => {
  const recipe = parseRecipeDraft({
    title: "  Dal Tadka  ",
    mealTypes: ["Lunch", "Lunch", "Unknown"],
    status: "keep",
    spiceLevel: 9,
    servings: 0,
    ingredients: [" 1 cup dal ", ""],
    steps: [" Pressure cook. ", "Add tadka."],
    rating: "5",
    sourceUrl: " https://www.instagram.com/reel/example/ ",
    calories: "460",
    proteinGrams: "999",
    fibreGrams: "12",
    lastCookedAt: "2026-08-25",
  });

  assert.equal(recipe.title, "Dal Tadka");
  assert.deepEqual(recipe.mealTypes, ["Lunch"]);
  assert.equal(recipe.spiceLevel, 3);
  assert.equal(recipe.servings, 0);
  assert.deepEqual(recipe.ingredients, ["1 cup dal"]);
  assert.equal(recipe.rating, 5);
  assert.equal(recipe.lastCookedAt, "2026-08-25");
  assert.equal(recipe.sourceUrl, "https://www.instagram.com/reel/example/");
  assert.equal(recipe.calories, 460);
  assert.equal(recipe.proteinGrams, 500);
  assert.equal(recipe.fibreGrams, 12);
});

test("rejects an incomplete recipe", () => {
  assert.throws(
    () => parseRecipeDraft({ title: "Chai", ingredients: [], steps: ["Boil."] }),
    /ingredient/i,
  );
});
