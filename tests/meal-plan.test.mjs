import assert from "node:assert/strict";
import test from "node:test";
import { buildMealPlan } from "../app/meal-plan.mjs";

const recipe = (id, title, calories, proteinGrams, fibreGrams) => ({
  id, title, calories, proteinGrams, fibreGrams, mealTypes: ["Lunch"], status: "keep",
});

test("changes recipe priority when the planning goal changes", () => {
  const highEnergy = recipe(1, "Paneer rice bowl", 850, 35, 7);
  const highFibre = recipe(2, "Chana vegetable bowl", 430, 25, 18);
  const recipes = [highEnergy, highFibre];

  const lossLunch = buildMealPlan(recipes, "weight-loss", 1)[0].meals[1].recipe;
  const gainLunch = buildMealPlan(recipes, "weight-gain", 1)[0].meals[1].recipe;
  assert.equal(lossLunch.id, highFibre.id);
  assert.equal(gainLunch.id, highEnergy.id);
});

test("leaves a slot open when the drawer has no suitable recipe", () => {
  const plan = buildMealPlan([recipe(1, "Lunch", 500, 20, 8)], "balanced", 1);
  assert.equal(plan[0].meals[0].recipe, null);
  assert.equal(plan[0].meals[1].recipe.title, "Lunch");
});
