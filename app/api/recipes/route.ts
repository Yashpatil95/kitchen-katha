import {
  createRecipe,
  deleteRecipe,
  listRecipes,
  parseRecipeDraft,
  updateRecipe,
} from "../../../db/recipes";
import { RecipeInputError } from "../../../db/recipe-input.mjs";
import { boundedJson, RequestBodyError } from "../bounded-json.mjs";

const MAX_JSON_BYTES = 256 * 1024;

const errorResponse = (error: unknown) => {
  if (error instanceof RequestBodyError || error instanceof RecipeInputError) {
    return Response.json({ error: error.message }, { status: error instanceof RequestBodyError ? error.status : 400 });
  }
  console.error("Recipe request failed", { name: error instanceof Error ? error.name : "UnknownError" });
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
};

const recipeId = (value: unknown) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new RecipeInputError("A valid recipe is required.");
  return id;
};

export async function GET() {
  try {
    return Response.json({ recipes: await listRecipes() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const recipe = await createRecipe(parseRecipeDraft(await boundedJson(request, MAX_JSON_BYTES)));
    return Response.json({ recipe }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await boundedJson(request, MAX_JSON_BYTES)) as Record<string, unknown>;
    const recipe = await updateRecipe(recipeId(payload.id), parseRecipeDraft(payload));
    return recipe
      ? Response.json({ recipe })
      : Response.json({ error: "Recipe not found." }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await boundedJson(request, MAX_JSON_BYTES)) as Record<string, unknown>;
    return (await deleteRecipe(recipeId(payload.id)))
      ? Response.json({ ok: true })
      : Response.json({ error: "Recipe not found." }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}
