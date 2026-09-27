import { parseRecipeDraft } from "./recipe-input.mjs";
import { mergeRecipeEvidence, RecipeTextError } from "./recipe-text.mjs";

const MAX_HTML_BYTES = 1_000_000;
const EVIDENCE_LIMITS = {
  caption: ["caption", 100_000],
  transcript: ["transcript", 100_000],
  imageText: ["image text", 50_000],
  commentText: ["comment text", 1_500],
};

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

const evidenceText = (value, field) => {
  if (value === null || typeof value === "undefined" || value === "") return "";
  const [label, limit] = EVIDENCE_LIMITS[field];
  if (typeof value !== "string") {
    throw new InstagramImportError("invalid_evidence", `The ${label} must be text.`, { status: 400, stage: "validate" });
  }
  const text = value.trim();
  if (text.length > limit) {
    throw new InstagramImportError(field === "caption" ? "caption_too_large" : "evidence_too_large", `The ${label} is too long to import safely.`, {
      status: 413,
      stage: "validate",
    });
  }
  return text;
};

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

export function parseInstagramCaption(caption, sourceUrl, { transcript = "", imageText = "", commentText = "" } = {}) {
  try {
    return mergeRecipeEvidence({ caption, transcript, imageText, commentText }, {
      fallbackTitle: "Instagram recipe",
      notes: "Automatically imported from Instagram. Check the original post if a quantity or technique is unclear.",
      sourceUrl,
    });
  } catch (error) {
    if (!(error instanceof RecipeTextError)) throw error;
    if (error.code === "text_too_large") {
      throw new InstagramImportError("caption_too_large", "The caption is too long to import safely.", { status: 413, stage: "validate" });
    }
    throw new InstagramImportError("empty_caption", "No usable recipe caption was found.");
  }
}

export async function importInstagramRecipe({
  url,
  caption,
  transcript,
  imageText,
  commentText,
  fetcher = fetch,
  findExisting,
  saveRecipe,
}) {
  const sourceUrl = instagramUrl(url);
  const evidence = {
    caption: evidenceText(caption, "caption"),
    transcript: evidenceText(transcript, "transcript"),
    imageText: evidenceText(imageText, "imageText"),
    commentText: evidenceText(commentText, "commentText"),
  };
  try {
    const existing = await findExisting(sourceUrl);
    if (existing) return { recipe: existing, alreadySaved: true };
  } catch {
    throw new InstagramImportError("storage_error", "Kitchen Katha could not check the recipe drawer.", { status: 500, stage: "deduplicate" });
  }

  if (!evidence.caption) {
    try {
      evidence.caption = await fetchInstagramCaption(sourceUrl, fetcher);
    } catch (error) {
      if (!evidence.transcript && !evidence.imageText) throw error;
    }
  }
  const parsed = parseInstagramCaption(evidence.caption, sourceUrl, evidence);
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
