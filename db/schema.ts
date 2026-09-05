import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  mealTypes: text("meal_types").notNull().default("[]"),
  cuisine: text("cuisine").notNull().default("Indian"),
  diet: text("diet").notNull().default("Vegetarian"),
  status: text("status").notNull().default("want-to-try"),
  spiceLevel: integer("spice_level").notNull().default(2),
  prepMinutes: integer("prep_minutes").notNull().default(0),
  cookMinutes: integer("cook_minutes").notNull().default(0),
  servings: integer("servings").notNull().default(2),
  ingredients: text("ingredients").notNull().default("[]"),
  steps: text("steps").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  calories: integer("calories"),
  proteinGrams: integer("protein_grams"),
  fibreGrams: integer("fibre_grams"),
  lastCookedAt: text("last_cooked_at"),
  rating: integer("rating"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
