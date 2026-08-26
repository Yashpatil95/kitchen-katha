import {
  createRecipe,
  deleteRecipe,
  listRecipes,
  parseRecipeDraft,
  updateRecipe,
} from "../../../db/recipes";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

const recipeId = (value: unknown) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error("A valid recipe is required.");
  return id;
};

export async function GET() {
  try {
    return Response.json({ recipes: await listRecipes() });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const recipe = await createRecipe(parseRecipeDraft(await request.json()));
    return Response.json({ recipe }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const recipe = await updateRecipe(recipeId(payload.id), parseRecipeDraft(payload));
    return recipe
      ? Response.json({ recipe })
      : Response.json({ error: "Recipe not found." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    return (await deleteRecipe(recipeId(payload.id)))
      ? Response.json({ ok: true })
      : Response.json({ error: "Recipe not found." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 400 });
  }
}
