import type { Metadata } from "next";
import { listRecipes, type Recipe } from "../db/recipes";
import { RecipeJournal } from "./recipe-journal";

export const metadata: Metadata = {
  title: "My recipe box",
  description: "Save, cook and refine the recipes worth making again.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  let recipes: Recipe[] = [];
  try {
    recipes = await listRecipes();
  } catch (error) {
    console.error("Could not load recipes", error);
  }
  return <RecipeJournal initialRecipes={recipes} />;
}
