import { MEAL_TYPES } from "./recipe-input.mjs";

const INGREDIENT_NAMES = "ingredients?|you(?:’|'| wi)ll need|samagri|सामग्री";
const METHOD_NAMES = "method|directions?|instructions?|steps?|procedure|how to make|preparation|vidhi|विधि|कृती";
const INGREDIENT_HEADING = new RegExp(`^(${INGREDIENT_NAMES})(?:\\s+(?:for|serves?)\\s+(\\d+)|\\s*\\((?:serves?\\s*)?(\\d+)\\))?\\s*(?:[:–—-]\\s*(.*))?$`, "i");
const METHOD_HEADING = new RegExp(`^(${METHOD_NAMES})\\s*(?:[:–—-]\\s*(.*))?$`, "i");
const IGNORE_LINE = /^(liked by|view all|more$|follow$|original audio|\d+\s+(likes?|comments?))/i;
const MAX_RECIPE_TEXT_LENGTH = 100_000;

export class RecipeTextError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RecipeTextError";
    this.code = code;
  }
}

const cleanLine = (line) =>
  line
    .replace(/^[\s•●▪◦‣·–—*-]+/, "")
    .replace(/^\s*(?:step\s*)?\d+[.)-]\s*/i, "")
    .trim();

const headingText = (line) => line.replace(/^[^\p{L}\p{M}]+/gu, "").trim();
const ingredientHeading = (line) => headingText(line).match(INGREDIENT_HEADING);
const methodHeading = (line) => headingText(line).match(METHOD_HEADING);

const splitItems = (value) => value
  ? String(value)
      .split(/\s*[;|]\s*|\s+(?=(?:step\s*)?\d+[.)-]\s+)/i)
      .map(cleanLine)
      .filter(Boolean)
  : [];

const usefulLines = (value) =>
  String(value)
    .replace(/\r/g, "")
    .replace(/[•●▪◦‣]\s*/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !IGNORE_LINE.test(line) && !/^#/.test(line) && !/^\[[^\]]*(?:recipe|food)[^\]]*\]$/i.test(line));

const mealTypesFor = (text) => [
  ["Breakfast", /breakfast|nashta|poha|upma|dosa|idli|paratha/i],
  ["Lunch", /lunch|thali/i],
  ["Dinner", /dinner|curry|dal|sabzi|biryani|pulao/i],
  ["Snacks", /snack|chaat|pakora|vada|cutlet|tikki/i],
  ["Baking", /bake|bread|cake|cookie|muffin/i],
  ["Drinks", /drink|chai|tea|coffee|lassi|sharbat|smoothie/i],
  ["Desserts", /dessert|sweet|mithai|halwa|kheer|ladoo|barfi/i],
  ["Sides", /side|chutney|raita|pickle/i],
].filter(([, pattern]) => pattern.test(text))
  .map(([meal]) => meal)
  .filter((meal) => MEAL_TYPES.includes(meal))
  .slice(0, 3);

const dietFor = (text) => {
  if (/\b(beef|pork|bacon|ham|steak)\b/i.test(text)) return "Other";
  if (/mutton|lamb|goat/i.test(text)) return "Mutton";
  if (/chicken/i.test(text)) return "Chicken";
  if (/fish|prawn|shrimp|seafood/i.test(text)) return "Seafood";
  if (/\begg/i.test(text)) return "Egg";
  if (/\bvegan\b/i.test(text)) return "Vegan";
  if (/\bjain\b/i.test(text)) return "Jain";
  if (/\bvegetarian\b|\bveg\b/i.test(text)) return "Vegetarian";
  return "Unknown";
};

export function parseRecipeText(value, { fallbackTitle = "Recipe", notes = "", sourceUrl = "" } = {}) {
  const rawText = String(value);
  if (rawText.length > MAX_RECIPE_TEXT_LENGTH) {
    throw new RecipeTextError("text_too_large", "The recipe text is too long to parse safely.");
  }
  const lines = usefulLines(rawText);
  if (!lines.length) throw new RecipeTextError("empty_text", "No usable recipe text was found.");

  const ingredientAt = lines.findIndex((line) => Boolean(ingredientHeading(line)));
  const methodAt = lines.findIndex((line) => Boolean(methodHeading(line)));
  const firstSection = [ingredientAt, methodAt].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? lines.length;
  const titleCandidates = lines.slice(0, firstSection).filter((line) => !/^@/.test(line));
  const title = cleanLine(titleCandidates[0] || fallbackTitle).slice(0, 120);
  const ingredientEnd = methodAt > ingredientAt ? methodAt : lines.length;
  const inlineIngredients = ingredientAt >= 0 ? ingredientHeading(lines[ingredientAt])?.[4] : "";
  const ingredients = ingredientAt >= 0
    ? [inlineIngredients, ...lines.slice(ingredientAt + 1, ingredientEnd)].flatMap(splitItems).filter(Boolean)
    : [];
  const inlineMethod = methodAt >= 0 ? methodHeading(lines[methodAt])?.[2] : "";
  const steps = methodAt >= 0
    ? [inlineMethod, ...lines.slice(methodAt + 1)].flatMap(splitItems).filter((line) => line && !/^#/.test(line))
    : [];
  const description = titleCandidates.slice(1).join(" ").slice(0, 400);
  const fullText = lines.join(" ");
  const mealTypes = mealTypesFor(fullText);
  const headingServings = ingredientAt >= 0 ? ingredientHeading(lines[ingredientAt]) : null;
  const servings = Number(headingServings?.[2] || headingServings?.[3] || fullText.match(/\bserves?\s*:?\s*(\d{1,3})\b/i)?.[1] || 0);
  const missing = [];
  if (!ingredients.length) missing.push("ingredients");
  if (!steps.length) missing.push("steps");

  return {
    draft: {
      title,
      description,
      mealTypes: mealTypes.length ? mealTypes : ["Other"],
      cuisine: /indian|masala|dal|paneer|sabzi|biryani|poha|dosa|idli|chutney|raita/i.test(fullText) ? "Indian" : "Other",
      diet: dietFor(fullText),
      status: "want-to-try",
      spiceLevel: /chilli|chili|mirchi|spicy|hot/i.test(fullText) ? 2 : -1,
      prepMinutes: 0,
      cookMinutes: 0,
      // ponytail: zero means “not stated” until these legacy non-null columns are made nullable.
      servings: servings >= 1 && servings <= 100 ? servings : 0,
      ingredients,
      steps,
      notes,
      sourceUrl,
      calories: null,
      proteinGrams: null,
      fibreGrams: null,
      lastCookedAt: null,
      rating: null,
    },
    missing,
    warnings: missing.map((field) => `${field === "ingredients" ? "Ingredients" : "Method steps"} were not clearly labelled.`),
  };
}

export function mergeRecipeEvidence(
  { caption = "", transcript = "", imageText = "", commentText = "" } = {},
  { fallbackTitle = "Recipe", notes = "", sourceUrl = "" } = {},
) {
  const drafts = [];
  for (const text of [caption, transcript, imageText]) {
    if (typeof text !== "string" || !text.trim()) continue;
    try {
      drafts.push(parseRecipeText(text, { fallbackTitle: "" }).draft);
    } catch (error) {
      if (error instanceof RecipeTextError && error.code === "empty_text") continue;
      throw error;
    }
  }
  if (!drafts.length) throw new RecipeTextError("empty_text", "No usable recipe text was found.");

  const first = (select, isPresent = Boolean) => drafts.map(select).find(isPresent);
  // ponytail: prefer whole sections to avoid duplicates; reconcile individual lines only if real imports lose complementary details.
  const ingredients = first((draft) => draft.ingredients, (value) => value.length) || [];
  const steps = first((draft) => draft.steps, (value) => value.length) || [];
  const missing = [];
  if (!ingredients.length) missing.push("ingredients");
  if (!steps.length) missing.push("steps");
  const comments = typeof commentText === "string" ? commentText.trim() : "";

  return {
    draft: {
      ...drafts[0],
      title: first((draft) => draft.title) || cleanLine(String(fallbackTitle)).slice(0, 120),
      description: first((draft) => draft.description) || "",
      mealTypes: first((draft) => draft.mealTypes, (value) => value.some((meal) => meal !== "Other")) || ["Other"],
      cuisine: first((draft) => draft.cuisine, (value) => value !== "Other") || "Other",
      diet: first((draft) => draft.diet, (value) => value !== "Unknown") || "Unknown",
      spiceLevel: first((draft) => draft.spiceLevel, (value) => value >= 0) ?? -1,
      servings: first((draft) => draft.servings, (value) => value > 0) || 0,
      ingredients,
      steps,
      notes: [notes, comments && `Comments (unverified):\n${comments}`].filter(Boolean).join("\n\n"),
      sourceUrl,
    },
    missing,
    warnings: missing.map((field) => `${field === "ingredients" ? "Ingredients" : "Method steps"} were not clearly labelled.`),
  };
}
