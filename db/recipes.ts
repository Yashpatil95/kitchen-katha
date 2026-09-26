import { desc, eq } from "drizzle-orm";
import { ensureRecipeStorage, getDb } from ".";
import { parseRecipeDraft, STATUSES } from "./recipe-input.mjs";
import { recipes } from "./schema";

export { parseRecipeDraft } from "./recipe-input.mjs";

export type RecipeStatus = "want-to-try" | "tried" | "keep" | "not-for-me";

export type Recipe = {
  id: number;
  title: string;
  description: string;
  mealTypes: string[];
  cuisine: string;
  diet: string;
  status: RecipeStatus;
  spiceLevel: number;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  notes: string;
  sourceUrl: string;
  calories: number | null;
  proteinGrams: number | null;
  fibreGrams: number | null;
  lastCookedAt: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
};

type RecipeDraft = ReturnType<typeof parseRecipeDraft>;

function toRecipe(row: typeof recipes.$inferSelect): Recipe {
  const parseList = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  };

  return {
    ...row,
    status: STATUSES.includes(row.status as RecipeStatus)
      ? (row.status as RecipeStatus)
      : "want-to-try",
    mealTypes: parseList(row.mealTypes),
    ingredients: parseList(row.ingredients),
    steps: parseList(row.steps),
  };
}

const toRow = (draft: RecipeDraft) => ({
  ...draft,
  mealTypes: JSON.stringify(draft.mealTypes),
  ingredients: JSON.stringify(draft.ingredients),
  steps: JSON.stringify(draft.steps),
});

export async function listRecipes() {
  await ensureRecipeStorage();
  return (await getDb().select().from(recipes).orderBy(desc(recipes.updatedAt), desc(recipes.id))).map(toRecipe);
}

export async function createRecipe(draft: RecipeDraft) {
  await ensureRecipeStorage();
  const [row] = await getDb().insert(recipes).values(toRow(draft)).returning();
  return toRecipe(row);
}

export async function findRecipeBySourceUrl(sourceUrl: string) {
  if (!sourceUrl) return null;
  await ensureRecipeStorage();
  const [row] = await getDb().select().from(recipes).where(eq(recipes.sourceUrl, sourceUrl)).limit(1);
  return row ? toRecipe(row) : null;
}

export async function createImportedRecipe(draft: RecipeDraft) {
  await ensureRecipeStorage();
  const existing = await findRecipeBySourceUrl(draft.sourceUrl);
  if (existing) return { recipe: existing, alreadySaved: true };

  try {
    const [row] = await getDb().insert(recipes).values(toRow(draft)).returning();
    return { recipe: toRecipe(row), alreadySaved: false };
  } catch (error) {
    const concurrent = await findRecipeBySourceUrl(draft.sourceUrl);
    if (concurrent) return { recipe: concurrent, alreadySaved: true };
    throw error;
  }
}

export async function updateRecipe(id: number, draft: RecipeDraft) {
  await ensureRecipeStorage();
  const [row] = await getDb()
    .update(recipes)
    .set({ ...toRow(draft), updatedAt: new Date().toISOString() })
    .where(eq(recipes.id, id))
    .returning();
  return row ? toRecipe(row) : null;
}

export async function deleteRecipe(id: number) {
  await ensureRecipeStorage();
  const [row] = await getDb().delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id });
  return Boolean(row);
}
