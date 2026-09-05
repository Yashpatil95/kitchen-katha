import { MEAL_TYPES } from "./recipe-input.mjs";

const INGREDIENT_HEADING = /^(ingredients?|you(?:’|'| wi)ll need|samagri|सामग्री)\s*:?️?$/i;
const METHOD_HEADING = /^(method|directions?|instructions?|steps?|procedure|vidhi|विधि|कृती)\s*:?️?$/i;
const IGNORE_LINE = /^(liked by|view all|more$|follow$|original audio|\d+\s+(likes?|comments?))/i;

const cleanLine = (line) =>
  line
    .replace(/^[\s•●▪◦‣·–—*-]+/, "")
    .replace(/^\s*(?:step\s*)?\d+[.)-]\s*/i, "")
    .trim();

const usefulLines = (caption) =>
  String(caption)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !IGNORE_LINE.test(line) && !/^#\S+(?:\s+#\S+)*$/.test(line));

export function instagramUrl(value) {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    throw new Error("Paste a complete Instagram post or reel link.");
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(host)) {
    throw new Error("Only secure Instagram links can be imported.");
  }
  if (!/^\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) {
    throw new Error("Use the link to one Instagram post or reel, not a profile or feed.");
  }
  return `https://www.instagram.com${url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`}`;
}

const mealTypesFor = (text) => {
  const matches = [
    ["Breakfast", /breakfast|nashta|poha|upma|dosa|idli|paratha/i],
    ["Lunch", /lunch|thali/i],
    ["Dinner", /dinner|curry|dal|sabzi|biryani|pulao/i],
    ["Snacks", /snack|chaat|pakora|vada|cutlet|tikki/i],
    ["Baking", /bake|bread|cake|cookie|muffin/i],
    ["Drinks", /drink|chai|tea|coffee|lassi|sharbat|smoothie/i],
    ["Desserts", /dessert|sweet|mithai|halwa|kheer|ladoo|barfi/i],
    ["Sides", /side|chutney|raita|pickle/i],
  ].filter(([, pattern]) => pattern.test(text)).map(([meal]) => meal);
  return matches.filter((meal) => MEAL_TYPES.includes(meal)).slice(0, 3);
};

const dietFor = (text) => {
  if (/mutton|lamb|goat/i.test(text)) return "Mutton";
  if (/chicken/i.test(text)) return "Chicken";
  if (/fish|prawn|shrimp|seafood/i.test(text)) return "Seafood";
  if (/\begg/i.test(text)) return "Egg";
  if (/vegan/i.test(text) || (!/milk|cream|paneer|ghee|butter|curd|yogurt|cheese|honey/i.test(text) && /tofu|plant[- ]based/i.test(text))) return "Vegan";
  if (/jain/i.test(text)) return "Jain";
  return "Vegetarian";
};

export function parseInstagramCaption(caption, sourceUrl) {
  const lines = usefulLines(caption);
  if (!lines.length) throw new Error("No recipe caption was found. Paste the caption and try again.");

  const ingredientAt = lines.findIndex((line) => INGREDIENT_HEADING.test(line));
  const methodAt = lines.findIndex((line) => METHOD_HEADING.test(line));
  const titleCandidates = lines.filter((line) =>
    !INGREDIENT_HEADING.test(line) && !METHOD_HEADING.test(line) && !/^@/.test(line),
  );
  const title = cleanLine(titleCandidates[0] || "Instagram recipe").slice(0, 120);
  const ingredientEnd = methodAt > ingredientAt ? methodAt : lines.length;
  const ingredients = ingredientAt >= 0
    ? lines.slice(ingredientAt + 1, ingredientEnd).map(cleanLine).filter(Boolean)
    : [];
  const steps = methodAt >= 0
    ? lines.slice(methodAt + 1).map(cleanLine).filter((line) => line && !/^#/.test(line))
    : [];
  const description = ingredientAt > 0
    ? lines.slice(1, ingredientAt).join(" ").slice(0, 400)
    : "Imported from Instagram — check the details before saving.";
  const fullText = lines.join(" ");
  const mealTypes = mealTypesFor(fullText);
  const warnings = [];
  if (!ingredients.length) warnings.push("Ingredients were not clearly labelled; add them before saving.");
  if (!steps.length) warnings.push("Method steps were not clearly labelled; add them before saving.");

  return {
    draft: {
      title,
      description,
      mealTypes: mealTypes.length ? mealTypes : ["Dinner"],
      cuisine: /indian|masala|dal|paneer|sabzi|biryani|poha|dosa|idli|chutney|raita/i.test(fullText) ? "Indian" : "Other",
      diet: dietFor(fullText),
      status: "want-to-try",
      spiceLevel: /chilli|chili|mirchi|spicy|hot/i.test(fullText) ? 2 : 1,
      prepMinutes: 0,
      cookMinutes: 0,
      servings: 2,
      ingredients,
      steps,
      notes: warnings.length ? "Imported automatically. Review quantities, timings and method against the original post." : "Imported from Instagram and reviewed before saving.",
      sourceUrl,
      calories: null,
      proteinGrams: null,
      fibreGrams: null,
      lastCookedAt: null,
      rating: null,
    },
    warnings,
  };
}
