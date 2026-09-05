import type { Metadata } from "next";
import { RecipeJournal } from "./recipe-journal";

export const metadata: Metadata = {
  title: "Home",
  description: "A cosy home for the recipes and kitchen lessons worth remembering.",
};

export default function Home() {
  return <RecipeJournal initialRecipes={[]} page="home" />;
}
