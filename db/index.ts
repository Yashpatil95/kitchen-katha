import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export function getD1() {
  if (!env.DB) getDb();
  return env.DB;
}

export async function ensureRecipeStorage() {
  if (!env.DB) getDb();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      meal_types TEXT NOT NULL DEFAULT '[]',
      cuisine TEXT NOT NULL DEFAULT 'Indian',
      diet TEXT NOT NULL DEFAULT 'Vegetarian',
      status TEXT NOT NULL DEFAULT 'want-to-try',
      spice_level INTEGER NOT NULL DEFAULT 2,
      prep_minutes INTEGER NOT NULL DEFAULT 0,
      cook_minutes INTEGER NOT NULL DEFAULT 0,
      servings INTEGER NOT NULL DEFAULT 2,
      ingredients TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      calories INTEGER,
      protein_grams INTEGER,
      fibre_grams INTEGER,
      last_cooked_at TEXT,
      rating INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const columns = await env.DB.prepare("PRAGMA table_info('recipes')").all<{ name: string }>();
  const names = new Set(columns.results.map((column: { name: string }) => column.name));
  const additions = [
    ["source_url", "ALTER TABLE recipes ADD COLUMN source_url TEXT NOT NULL DEFAULT ''"],
    ["calories", "ALTER TABLE recipes ADD COLUMN calories INTEGER"],
    ["protein_grams", "ALTER TABLE recipes ADD COLUMN protein_grams INTEGER"],
    ["fibre_grams", "ALTER TABLE recipes ADD COLUMN fibre_grams INTEGER"],
  ];
  for (const [name, sql] of additions) {
    if (!names.has(name)) await env.DB.prepare(sql).run();
  }
}
