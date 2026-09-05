import type { Metadata } from "next";
import { listRecipes, type Recipe } from "../../db/recipes";
import { RecipeJournal } from "../recipe-journal";

export const metadata: Metadata = {
  title: "Recipe drawer",
  description: "Search, open and refine the recipes saved in your Kitchen Katha drawer.",
};

export const dynamic = "force-dynamic";

export default async function Recipes() {
  let recipes: Recipe[] = [];
  try {
    recipes = await listRecipes();
  } catch (error) {
    console.error("Could not load recipes", error);
  }
  return <RecipeJournal initialRecipes={recipes} page="recipes" />;
}
