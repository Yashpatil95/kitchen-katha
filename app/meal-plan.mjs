export const GOALS = ["balanced", "weight-loss", "weight-gain"];
export const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const scoreRecipe = (recipe, goal) => {
  const calories = recipe.calories ?? 0;
  const protein = recipe.proteinGrams ?? 0;
  const fibre = recipe.fibreGrams ?? 0;
  const trusted = recipe.status === "keep" ? 6 : recipe.status === "tried" ? 3 : 0;
  if (goal === "weight-loss") return protein * 3 + fibre * 7 - Math.max(0, calories - 550) * 0.04 + trusted;
  if (goal === "weight-gain") return calories * 0.05 + protein * 2 + fibre * 2 + trusted;
  return protein * 2 + fibre * 5 - (calories ? Math.abs(calories - 500) * 0.01 : 0) + trusted;
};

const fitsSlot = (recipe, slot) => {
  const accepted = slot === "Snack" ? ["Snacks", "Baking", "Drinks", "Desserts"] :
    slot === "Lunch" || slot === "Dinner" ? [slot, "Sides"] : [slot];
  return recipe.mealTypes.some((meal) => accepted.includes(meal));
};

export function buildMealPlan(recipes, goal = "balanced", dayCount = 7, offset = 0) {
  const usable = recipes.filter((recipe) => recipe.status !== "not-for-me");
  return Array.from({ length: Math.max(1, Math.min(14, dayCount)) }, (_, dayIndex) => {
    const used = new Set();
    const meals = MEAL_SLOTS.map((slot) => {
      const candidates = usable
        .filter((recipe) => fitsSlot(recipe, slot))
        .sort((a, b) => scoreRecipe(b, goal) - scoreRecipe(a, goal) || a.title.localeCompare(b.title));
      if (!candidates.length) return { slot, recipe: null };
      const start = (dayIndex + offset) % candidates.length;
      const recipe = candidates.find((candidate, index) => index >= start && !used.has(candidate.id))
        || candidates.find((candidate) => !used.has(candidate.id))
        || candidates[start];
      used.add(recipe.id);
      return { slot, recipe };
    });
    return { day: dayIndex + 1, meals };
  });
}
