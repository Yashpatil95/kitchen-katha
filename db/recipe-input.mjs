export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Baking",
  "Drinks",
  "Desserts",
  "Sides",
];

export const STATUSES = ["want-to-try", "tried", "keep", "not-for-me"];

const text = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const numberInRange = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, Math.round(number)))
    : fallback;
};

const optionalNumberInRange = (value, min, max) =>
  value === null || value === "" || typeof value === "undefined"
    ? null
    : numberInRange(value, min, max, null);

const sourceUrl = (value) => {
  const candidate = text(value, 500);
  if (!candidate) return "";
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("The original recipe link must start with http:// or https://.");
  }
  if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  throw new Error("The original recipe link must start with http:// or https://.");
};

const stringList = (value, maxItems, maxLength) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

export function parseRecipeDraft(value) {
  if (!value || typeof value !== "object") throw new Error("Recipe details are required.");
  const title = text(value.title, 120);
  const ingredients = stringList(value.ingredients, 100, 180);
  const steps = stringList(value.steps, 60, 600);

  if (!title) throw new Error("Give your recipe a name.");
  if (!ingredients.length) throw new Error("Add at least one ingredient.");
  if (!steps.length) throw new Error("Add at least one cooking step.");

  const mealTypes = [...new Set(stringList(value.mealTypes, MEAL_TYPES.length, 30))]
    .filter((item) => MEAL_TYPES.includes(item));
  const status = STATUSES.includes(value.status) ? value.status : "want-to-try";
  const rawRating = value.rating === null || value.rating === "" ? null : Number(value.rating);
  const lastCookedAt = text(value.lastCookedAt, 10);

  return {
    title,
    description: text(value.description, 400),
    mealTypes: mealTypes.length ? mealTypes : ["Dinner"],
    cuisine: text(value.cuisine, 60) || "Indian",
    diet: text(value.diet, 40) || "Vegetarian",
    status,
    spiceLevel: numberInRange(value.spiceLevel, 0, 3, 2),
    prepMinutes: numberInRange(value.prepMinutes, 0, 1440, 0),
    cookMinutes: numberInRange(value.cookMinutes, 0, 1440, 0),
    servings: numberInRange(value.servings, 1, 100, 2),
    ingredients,
    steps,
    notes: text(value.notes, 2000),
    sourceUrl: sourceUrl(value.sourceUrl),
    calories: optionalNumberInRange(value.calories, 0, 10000),
    proteinGrams: optionalNumberInRange(value.proteinGrams, 0, 500),
    fibreGrams: optionalNumberInRange(value.fibreGrams, 0, 200),
    lastCookedAt: /^\d{4}-\d{2}-\d{2}$/.test(lastCookedAt) ? lastCookedAt : null,
    rating:
      rawRating !== null && Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5
        ? rawRating
        : null,
  };
}
