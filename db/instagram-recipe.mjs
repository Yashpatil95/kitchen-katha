import { MEAL_TYPES, parseRecipeDraft } from "./recipe-input.mjs";

const INGREDIENT_NAMES = "ingredients?|you(?:’|'| wi)ll need|samagri|सामग्री";
const METHOD_NAMES = "method|directions?|instructions?|steps?|procedure|how to make|preparation|vidhi|विधि|कृती";
const INGREDIENT_HEADING = new RegExp(`^(${INGREDIENT_NAMES})(?:\\s+(?:for|serves?)\\s+(\\d+)|\\s*\\((?:serves?\\s*)?(\\d+)\\))?\\s*(?:[:–—-]\\s*(.*))?$`, "i");
const METHOD_HEADING = new RegExp(`^(${METHOD_NAMES})\\s*(?:[:–—-]\\s*(.*))?$`, "i");
const IGNORE_LINE = /^(liked by|view all|more$|follow$|original audio|\d+\s+(likes?|comments?))/i;
const MAX_HTML_BYTES = 1_000_000;
const MAX_CAPTION_LENGTH = 100_000;

export class InstagramImportError extends Error {
  constructor(code, message, { status = 422, stage = "parse", canPasteCaption = false, draft = null, missing = [] } = {}) {
    super(message);
    this.name = "InstagramImportError";
    this.code = code;
    this.status = status;
    this.stage = stage;
    this.canPasteCaption = canPasteCaption;
    this.draft = draft;
    this.missing = missing;
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
const isIngredientHeading = (line) => Boolean(ingredientHeading(line));
const isMethodHeading = (line) => Boolean(methodHeading(line));

const splitItems = (value) => value
  ? String(value)
      .split(/\s*[;|]\s*|\s+(?=(?:step\s*)?\d+[.)-]\s+)/i)
      .map(cleanLine)
      .filter(Boolean)
  : [];

const usefulLines = (caption) =>
  String(caption)
    .replace(/\r/g, "")
    .replace(/[•●▪◦‣]\s*/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !IGNORE_LINE.test(line) && !/^#/.test(line) && !/^\[[^\]]*(?:recipe|food)[^\]]*\]$/i.test(line));

export function instagramUrl(value) {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    throw new InstagramImportError("invalid_link", "Paste a complete Instagram post or reel link.", { status: 400, stage: "validate" });
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(host)) {
    throw new InstagramImportError("invalid_link", "Only secure Instagram links can be imported.", { status: 400, stage: "validate" });
  }
  const match = url.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]+)\/?$/);
  if (!match) {
    throw new InstagramImportError("invalid_link", "Use the link to one Instagram post or reel, not a profile or feed.", { status: 400, stage: "validate" });
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
  const caption = String(html).match(/<div\b[^>]*class=["'][^"']*\bCaption\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (caption) return decodeHtml(caption
    .replace(/<a\b[^>]*class=["'][^"']*\bCaptionUsername\b[^"']*["'][^>]*>[\s\S]*?<\/a>/i, "")
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
  throw new InstagramImportError("caption_unavailable", "Instagram did not expose a readable public caption.", {
    stage: "retrieve",
    canPasteCaption: true,
  });
}

const boundedText = async (response) => {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_HTML_BYTES) {
    throw new InstagramImportError("response_too_large", "Instagram returned more data than can be imported safely.", {
      status: 502,
      stage: "retrieve",
      canPasteCaption: true,
    });
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new InstagramImportError("response_too_large", "Instagram returned more data than can be imported safely.", {
        status: 502,
        stage: "retrieve",
        canPasteCaption: true,
      });
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
};

export async function fetchInstagramCaption(sourceUrl, fetcher = fetch) {
  const errors = [];
  for (const candidate of [`${sourceUrl}embed/captioned/`, sourceUrl]) {
    try {
      const response = await fetcher(candidate, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; KitchenKatha/1.0)" },
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        errors.push(response.status === 429 || response.status >= 500 ? "upstream_unavailable" : "caption_unavailable");
        continue;
      }
      try {
        return captionFromInstagramHtml(await boundedText(response));
      } catch (error) {
        if (error instanceof InstagramImportError) errors.push(error.code);
        else throw error;
      }
    } catch (error) {
      if (error instanceof InstagramImportError) {
        errors.push(error.code);
      } else if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        errors.push("upstream_timeout");
      } else {
        errors.push("upstream_unavailable");
      }
    }
  }

  if (errors.includes("response_too_large")) {
    throw new InstagramImportError("response_too_large", "Instagram returned more data than can be imported safely.", {
      status: 502, stage: "retrieve", canPasteCaption: true,
    });
  }
  if (errors.every((code) => code === "upstream_timeout")) {
    throw new InstagramImportError("upstream_timeout", "Instagram took too long to respond.", {
      status: 504, stage: "retrieve", canPasteCaption: true,
    });
  }
  if (errors.includes("upstream_unavailable")) {
    throw new InstagramImportError("upstream_unavailable", "Instagram is temporarily unavailable.", {
      status: 502, stage: "retrieve", canPasteCaption: true,
    });
  }
  throw new InstagramImportError("caption_unavailable", "Instagram did not make this caption public.", {
    stage: "retrieve",
    canPasteCaption: true,
  });
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

export function parseInstagramCaption(caption, sourceUrl) {
  const rawCaption = String(caption);
  if (rawCaption.length > MAX_CAPTION_LENGTH) {
    throw new InstagramImportError("caption_too_large", "The caption is too long to import safely.", { status: 413, stage: "validate" });
  }
  const lines = usefulLines(rawCaption);
  if (!lines.length) throw new InstagramImportError("empty_caption", "No usable recipe caption was found.");

  const ingredientAt = lines.findIndex(isIngredientHeading);
  const methodAt = lines.findIndex(isMethodHeading);
  const firstSection = [ingredientAt, methodAt].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? lines.length;
  const titleCandidates = lines.slice(0, firstSection).filter((line) => !/^@/.test(line));
  const title = cleanLine(titleCandidates[0] || "Instagram recipe").slice(0, 120);
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
      notes: "Automatically imported from Instagram. Check the original post if a quantity or technique is unclear.",
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

export async function importInstagramRecipe({ url, caption, fetcher = fetch, findExisting, saveRecipe }) {
  const sourceUrl = instagramUrl(url);
  try {
    const existing = await findExisting(sourceUrl);
    if (existing) return { recipe: existing, alreadySaved: true };
  } catch {
    throw new InstagramImportError("storage_error", "Kitchen Katha could not check the recipe drawer.", { status: 500, stage: "deduplicate" });
  }

  const suppliedCaption = typeof caption === "string" ? caption.trim() : "";
  const parsed = parseInstagramCaption(suppliedCaption || await fetchInstagramCaption(sourceUrl, fetcher), sourceUrl);
  if (parsed.missing.length) {
    throw new InstagramImportError("incomplete_caption", "I found part of the recipe, but some required information is missing.", {
      stage: "parse",
      draft: parsed.draft,
      missing: parsed.missing,
    });
  }

  try {
    return await saveRecipe(parseRecipeDraft(parsed.draft));
  } catch {
    throw new InstagramImportError("storage_error", "Kitchen Katha could not save this recipe.", { status: 500, stage: "save" });
  }
}
