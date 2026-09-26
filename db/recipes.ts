import { desc, eq } from "drizzle-orm";
import { ensureRecipeStorage, getD1, getDb } from ".";
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

  const row = toRow(draft);
  const result = await getD1().prepare(`
    INSERT INTO recipes (
      title, description, meal_types, cuisine, diet, status, spice_level,
      prep_minutes, cook_minutes, servings, ingredients, steps, notes,
      source_url, calories, protein_grams, fibre_grams, last_cooked_at, rating
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE source_url = ?)
  `).bind(
    row.title,
    row.description,
    row.mealTypes,
    row.cuisine,
    row.diet,
    row.status,
    row.spiceLevel,
    row.prepMinutes,
    row.cookMinutes,
    row.servings,
    row.ingredients,
    row.steps,
    row.notes,
    row.sourceUrl,
    row.calories,
    row.proteinGrams,
    row.fibreGrams,
    row.lastCookedAt,
    row.rating,
    row.sourceUrl,
  ).run();
  const recipe = await findRecipeBySourceUrl(draft.sourceUrl);
  if (!recipe) throw new Error("The imported recipe was not saved.");
  return { recipe, alreadySaved: result.meta.changes === 0 };
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
