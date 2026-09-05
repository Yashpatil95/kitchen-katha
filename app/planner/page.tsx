import type { Metadata } from "next";
import { listRecipes, type Recipe } from "../../db/recipes";
import { MealPlanner } from "./meal-planner";

export const metadata: Metadata = {
  title: "Meal planner",
  description: "Arrange recipes from your Kitchen Katha drawer into an evidence-informed weekly plan.",
};

export const dynamic = "force-dynamic";

export default async function Planner() {
  let recipes: Recipe[] = [];
  try {
    recipes = await listRecipes();
  } catch (error) {
    console.error("Could not load recipes", error);
  }
  return <MealPlanner recipes={recipes} />;
}
