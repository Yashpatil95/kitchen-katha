import { MEAL_TYPES } from "./recipe-input.mjs";

const INGREDIENT_HEADING = /^(ingredients?|you(?:’|'| wi)ll need|samagri|सामग्री)(?:\s+\(.*\))?$/i;
const METHOD_HEADING = /^(method|directions?|instructions?|steps?|procedure|vidhi|विधि|कृती)(?:\s+\(.*\))?$/i;
const IGNORE_LINE = /^(liked by|view all|more$|follow$|original audio|\d+\s+(likes?|comments?))/i;

const cleanLine = (line) =>
  line
    .replace(/^[\s•●▪◦‣·–—*-]+/, "")
    .replace(/^\s*(?:step\s*)?\d+[.)-]\s*/i, "")
    .trim();

const heading = (line) => line.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M})]+$/gu, "").trim();
const isIngredientHeading = (line) => INGREDIENT_HEADING.test(heading(line));
const isMethodHeading = (line) => METHOD_HEADING.test(heading(line));

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
  const match = url.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]+)\/?$/);
  if (!match) {
    throw new Error("Use the link to one Instagram post or reel, not a profile or feed.");
  }
  const type = match[1] === "reels" ? "reel" : match[1];
  return `https://www.instagram.com/${type}/${match[2]}/`;
}

const decodeHtml = (value) => value
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

export function captionFromInstagramHtml(html) {
  const caption = String(html).match(/<div\s+class=["']Caption["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (caption) return decodeHtml(caption
    .replace(/<a\b[^>]*class=["']CaptionUsername["'][^>]*>[\s\S]*?<\/a>/i, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, ""))
    .replace(/^\s+/, "")
    .trim();

  const tags = String(html).match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    const property = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (!["og:description", "description"].includes(property || "")) continue;
    const content = tag.match(/content=["']([\s\S]*?)["'](?:\s|\/?>)/i)?.[1];
    if (!content) continue;
    const decoded = decodeHtml(content);
    return (decoded.match(/:\s*[“"]([\s\S]+)[”"]\s*$/)?.[1] || decoded).trim();
  }
  throw new Error("Instagram did not expose a readable public caption.");
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
  if (!lines.length) throw new Error("No usable recipe caption was found.");

  const ingredientAt = lines.findIndex(isIngredientHeading);
  const methodAt = lines.findIndex(isMethodHeading);
  const titleCandidates = lines.filter((line) =>
    !isIngredientHeading(line) && !isMethodHeading(line) && !/^@/.test(line),
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
  if (!ingredients.length) warnings.push("Ingredients were not clearly labelled.");
  if (!steps.length) warnings.push("Method steps were not clearly labelled.");

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
      notes: "Automatically imported from Instagram. Check the original post if a quantity or technique is unclear.",
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
