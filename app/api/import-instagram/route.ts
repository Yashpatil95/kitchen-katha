import { InstagramImportError, importInstagramRecipe } from "../../../db/instagram-recipe.mjs";
import { createImportedRecipe, findRecipeBySourceUrl } from "../../../db/recipes";
import { boundedJson, RequestBodyError } from "../bounded-json.mjs";

const MAX_JSON_BYTES = 1_100_000;

export async function POST(request: Request) {
  try {
    let payload: {
      url?: unknown;
      caption?: unknown;
      transcript?: unknown;
      imageText?: unknown;
      commentText?: unknown;
    };
    try {
      payload = await boundedJson(request, MAX_JSON_BYTES) as typeof payload;
    } catch (error) {
      if (error instanceof RequestBodyError) throw error;
      throw new InstagramImportError("invalid_request", "Send an Instagram link to import.", {
        status: 400,
        stage: "validate",
      });
    }

    const result = await importInstagramRecipe({
      url: payload.url,
      caption: payload.caption,
      transcript: payload.transcript,
      imageText: payload.imageText,
      commentText: payload.commentText,
      findExisting: findRecipeBySourceUrl,
      saveRecipe: createImportedRecipe,
    });
    return Response.json(result, { status: result.alreadySaved ? 200 : 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: `${error.message} Nothing was saved.`, code: "invalid_request" }, { status: error.status });
    }
    const known = error instanceof InstagramImportError
      ? error
      : new InstagramImportError("unexpected_error", "This recipe could not be imported.", { status: 500, stage: "unknown" });
    console.warn("Instagram import failed", { code: known.code, stage: known.stage });

    const nextStep = known.canPasteCaption
      ? " Paste the caption below instead. Nothing was saved."
      : known.draft
        ? " Review the highlighted fields before saving. Nothing was saved yet."
        : " Nothing was saved.";
    return Response.json({
      error: `${known.message}${nextStep}`,
      code: known.code,
      canPasteCaption: known.canPasteCaption,
      draft: known.draft,
      missing: known.missing,
    }, { status: known.status });
  }
}
