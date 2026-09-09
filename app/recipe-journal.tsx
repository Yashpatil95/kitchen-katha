"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- vinext's Next Link shim currently loads a second React renderer. */

import { FormEvent, useMemo, useRef, useState } from "react";
import type { Recipe, RecipeStatus } from "../db/recipes";

const mealTypes = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Baking",
  "Drinks",
  "Desserts",
  "Sides",
];

const statusLabels: Record<RecipeStatus, string> = {
  "want-to-try": "Want to try",
  tried: "Tried",
  keep: "Keeper",
  "not-for-me": "Not for me",
};

const mealEmoji: Record<string, string> = {
  Breakfast: "☀️",
  Lunch: "🥗",
  Dinner: "🍲",
  Snacks: "🥟",
  Baking: "🥖",
  Drinks: "🫖",
  Desserts: "🍮",
  Sides: "🥣",
};

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );

function SpiceLevel({ level }: { level: number }) {
  return (
    <span className="spice-level" aria-label={`${level} out of 3 spice level`}>
      {[1, 2, 3].map((dot) => (
        <i key={dot} className={dot <= level ? "hot" : ""} />
      ))}
    </span>
  );
}

export function RecipeJournal({ initialRecipes, page }: { initialRecipes: Recipe[]; page: "home" | "recipes" }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [mealFilter, setMealFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [message, setMessage] = useState("");
  const formDialog = useRef<HTMLDialogElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesText =
        !needle ||
        [recipe.title, recipe.description, recipe.cuisine, recipe.diet, ...recipe.ingredients]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesMeal = mealFilter === "All" || recipe.mealTypes.includes(mealFilter);
      const matchesStatus = statusFilter === "all" || recipe.status === statusFilter;
      return matchesText && matchesMeal && matchesStatus;
    });
  }, [mealFilter, query, recipes, statusFilter]);

  const drawerRecipes = [...filtered].reverse();

  const openForm = (recipe: Recipe | null = null) => {
    setEditing(recipe);
    setMessage("");
    formDialog.current?.showModal();
  };

  const importRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportBusy(true);
    setImportMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/import-instagram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: data.get("instagramUrl") }),
      });
      const result = (await response.json()) as { recipe?: Recipe; alreadySaved?: boolean; error?: string };
      if (!response.ok || !result.recipe) throw new Error(result.error || "The recipe could not be imported.");
      if (!result.alreadySaved) setRecipes((current) => [result.recipe!, ...current]);
      setSelected(result.recipe);
      form.reset();
      detailDialog.current?.showModal();
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "The recipe could not be imported.");
    } finally {
      setImportBusy(false);
    }
  };

  const openRecipe = (recipe: Recipe) => {
    setSelected(recipe);
    detailDialog.current?.showModal();
  };

  const saveRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      title: data.get("title"),
      description: data.get("description"),
      mealTypes: data.getAll("mealTypes"),
      cuisine: data.get("cuisine"),
      diet: data.get("diet"),
      status: data.get("status"),
      spiceLevel: data.get("spiceLevel"),
      prepMinutes: data.get("prepMinutes"),
      cookMinutes: data.get("cookMinutes"),
      servings: data.get("servings"),
      ingredients: String(data.get("ingredients") ?? "").split("\n"),
      steps: String(data.get("steps") ?? "").split("\n"),
      notes: data.get("notes"),
      sourceUrl: data.get("sourceUrl"),
      calories: data.get("calories"),
      proteinGrams: data.get("proteinGrams"),
      fibreGrams: data.get("fibreGrams"),
      lastCookedAt: data.get("lastCookedAt"),
      rating: data.get("rating"),
    };

    try {
      const response = await fetch("/api/recipes", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { recipe?: Recipe; error?: string };
      if (!response.ok || !result.recipe) throw new Error(result.error || "The recipe could not be saved.");

      setRecipes((current) =>
        editing
          ? current.map((recipe) => (recipe.id === result.recipe!.id ? result.recipe! : recipe))
          : [result.recipe!, ...current],
      );
      setSelected(result.recipe);
      formDialog.current?.close();
      setEditing(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The recipe could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const removeRecipe = async () => {
    if (!selected || !window.confirm(`Remove “${selected.title}” from your recipe box?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/recipes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      if (!response.ok) throw new Error("The recipe could not be removed.");
      setRecipes((current) => current.filter((recipe) => recipe.id !== selected.id));
      detailDialog.current?.close();
      setSelected(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The recipe could not be removed.");
    } finally {
      setBusy(false);
    }
  };

  const editSelected = () => {
    if (!selected) return;
    detailDialog.current?.close();
    openForm(selected);
  };

  const resetFilters = () => {
    setQuery("");
    setMealFilter("All");
    setStatusFilter("all");
  };

  const formRecipe = editing;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Kitchen Katha home">
          <span className="brand-mark">र</span>
          <span>Kitchen Katha</span>
        </a>
        <nav className="topbar-actions" aria-label="Primary navigation">
          <a className="nav-link" href={page === "home" ? "/recipes" : "/"}>{page === "home" ? "Recipe drawer" : "Home"}</a>
          <a className="nav-link" href="/planner">Meal planner</a>
          <button className="button button-small" onClick={() => openForm()}>
            <span aria-hidden="true">＋</span> Add recipe
          </button>
        </nav>
      </header>

      {page === "home" ? <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Your personal cooking journal</p>
          <h1>Cook it. Note it.<br /><em>Keep the good ones.</em></h1>
          <p className="hero-text">
            A cosy home for every dal you perfect, bake you attempt and chai blend you want to remember.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/recipes">Open recipe drawer <span aria-hidden="true">→</span></a>
            <button className="button button-outline" onClick={() => openForm()}>Add a recipe</button>
          </div>
        </div>
        <div className="hero-board" aria-label="Your recipe box at a glance">
          <div className="sun-shape" />
          <div className="spice-bowl spice-bowl-one"><span>✦</span></div>
          <div className="spice-bowl spice-bowl-two"><span>❋</span></div>
          <div className="hero-card">
            <span className="hero-card-label">This week&apos;s note</span>
            <strong>“Two whistles were plenty.”</strong>
            <span>Rajma masala · 23 Aug</span>
          </div>
          <div className="leaf leaf-one" />
          <div className="leaf leaf-two" />
        </div>
      </section> : (

      <section className="recipe-section" aria-labelledby="recipe-box-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Saved with care</p>
            <h2 id="recipe-box-title">Your recipe box</h2>
          </div>
          <div className="stats" aria-label="Recipe totals">
            <div><strong>{recipes.length}</strong><span>Recipes</span></div>
            <div><strong>{recipes.filter((recipe) => recipe.status === "want-to-try").length}</strong><span>To try</span></div>
            <div><strong>{recipes.filter((recipe) => recipe.status === "keep").length}</strong><span>Keepers</span></div>
          </div>
        </div>

        <form className="instagram-import" onSubmit={importRecipe}>
          <div className="import-copy">
            <span className="import-icon" aria-hidden="true">◎</span>
            <div><strong>Add a recipe from Instagram</strong><p>Paste a public post or reel link. Kitchen Katha will extract the recipe, format it and save the finished card automatically.</p></div>
          </div>
          <div className="import-fields">
            <label className="field"><span className="sr-only">Instagram recipe link</span><input name="instagramUrl" type="url" required placeholder="https://www.instagram.com/reel/…" /></label>
            <button className="button button-primary" disabled={importBusy}>{importBusy ? "Creating card…" : "Add to drawer"}</button>
          </div>
          <small className="import-limit">Works with public posts whose caption contains the ingredients and method.</small>
          {importMessage && <p className="form-error" role="alert">{importMessage}</p>}
        </form>

        <div className="toolbar">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search recipes</span>
            <input
              type="search"
              placeholder="Search dishes, ingredients, regions…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="select-box">
            <span className="sr-only">Filter by cooking status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All stages</option>
              <option value="want-to-try">Want to try</option>
              <option value="tried">Tried</option>
              <option value="keep">Keepers</option>
              <option value="not-for-me">Not for me</option>
            </select>
          </label>
        </div>

        <div className="filter-row" aria-label="Filter by meal type">
          {["All", ...mealTypes].map((meal) => (
            <button
              key={meal}
              className={mealFilter === meal ? "filter-chip active" : "filter-chip"}
              aria-pressed={mealFilter === meal}
              onClick={() => setMealFilter(meal)}
            >
              {meal}
            </button>
          ))}
        </div>

        {drawerRecipes.length ? (
          <div className="recipe-drawer-shell">
            <div className="drawer-guide">
              <span>Recipe drawer</span>
              <p>{drawerRecipes.length} {drawerRecipes.length === 1 ? "card" : "cards"} filed here · Tap a labelled edge to pull one out</p>
            </div>
            <div className="recipe-drawer" role="list">
            {drawerRecipes.map((recipe, index) => {
              const primaryMeal = recipe.mealTypes[0] || "Dinner";
              const isFrontCard = index === drawerRecipes.length - 1;
              return (
                <article className={isFrontCard ? "recipe-card drawer-front" : "recipe-card"} id={`recipe-${recipe.id}`} key={recipe.id} role="listitem">
                  <button className="drawer-tab" type="button" onClick={() => openRecipe(recipe)} aria-label={`Pull out ${recipe.title}`}>
                    <span className="drawer-tab-emoji" aria-hidden="true">{mealEmoji[primaryMeal] || "🍽️"}</span>
                    <span className="drawer-tab-copy">
                      <strong>{recipe.title}</strong>
                      <small>{recipe.cuisine} · {primaryMeal}</small>
                    </span>
                    <span className={`drawer-tab-status status-${recipe.status}`}>{statusLabels[recipe.status]}</span>
                    <span className="drawer-tab-arrow" aria-hidden="true">↗</span>
                  </button>
                  <div className="drawer-card-preview" aria-hidden={!isFrontCard}>
                    <div className={`card-art art-${primaryMeal.toLowerCase()}`}>
                      <span className="meal-emoji" aria-hidden="true">{mealEmoji[primaryMeal] || "🍽️"}</span>
                      <span className={`status-badge status-${recipe.status}`}>{statusLabels[recipe.status]}</span>
                      {recipe.rating && <span className="rating-badge">★ {recipe.rating}</span>}
                    </div>
                    <div className="card-content">
                      <div className="card-kicker">
                        <span>{recipe.cuisine}</span>
                        <SpiceLevel level={recipe.spiceLevel} />
                      </div>
                      <h3>{recipe.title}</h3>
                      <p>{recipe.description || "A recipe waiting for your personal notes."}</p>
                      <div className="card-meta">
                        <span>◷ {recipe.prepMinutes + recipe.cookMinutes} min</span>
                        <span>Serves {recipe.servings}</span>
                        <span>{recipe.diet}</span>
                        {recipe.proteinGrams !== null && <span>{recipe.proteinGrams}g protein</span>}
                      </div>
                      <button className="text-button" tabIndex={isFrontCard ? 0 : -1} onClick={() => openRecipe(recipe)}>
                        Pull out this recipe <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            </div>
          </div>
        ) : recipes.length ? (
          <div className="empty-state">
            <span aria-hidden="true">🥄</span>
            <h3>No recipes match those filters</h3>
            <p>Try another ingredient or clear the filters.</p>
            <button className="button button-outline" onClick={resetFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="empty-state first-recipe">
            <span aria-hidden="true">📖</span>
            <h3>Your recipe box is ready</h3>
            <p>Add the first dish you want to try, then come back after cooking to record what worked.</p>
            <button className="button button-primary" onClick={() => openForm()}>Add a recipe</button>
          </div>
        )}
      </section>
      )}

      <footer>
        <span className="brand-mark">र</span>
        <p>Made for recipes worth repeating.</p>
      </footer>

      <dialog className="recipe-dialog form-dialog" ref={formDialog} onClose={() => setEditing(null)}>
        <form key={editing?.id ?? "new"} onSubmit={saveRecipe}>
          <div className="dialog-header">
            <div>
              <p className="eyebrow"><span /> {editing ? "Refine your notes" : "A new kitchen memory"}</p>
              <h2>{editing ? "Edit recipe" : "Add a recipe"}</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Close" onClick={() => formDialog.current?.close()}>×</button>
          </div>

          <div className="form-grid">
            <label className="field field-wide">Recipe name
              <input name="title" required maxLength={120} defaultValue={formRecipe?.title} placeholder="e.g. Aai’s Sunday poha" />
            </label>
            <label className="field field-wide">Short description
              <textarea name="description" rows={2} maxLength={400} defaultValue={formRecipe?.description} placeholder="What makes this version special?" />
            </label>

            <fieldset className="field field-wide check-group">
              <legend>Where does it fit?</legend>
              <div>
                {mealTypes.map((meal) => (
                  <label key={meal}>
                    <input type="checkbox" name="mealTypes" value={meal} defaultChecked={formRecipe ? formRecipe.mealTypes?.includes(meal) : meal === "Dinner"} />
                    <span>{meal}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field">Cuisine or region
              <input name="cuisine" maxLength={60} defaultValue={formRecipe?.cuisine ?? "Indian"} placeholder="Maharashtrian" />
            </label>
            <label className="field">Diet
              <select name="diet" defaultValue={formRecipe?.diet ?? "Vegetarian"}>
                <option>Vegetarian</option><option>Vegan</option><option>Jain</option><option>Egg</option><option>Chicken</option><option>Seafood</option><option>Mutton</option><option>Other</option>
              </select>
            </label>
            <label className="field">Cooking stage
              <select name="status" defaultValue={formRecipe?.status ?? "want-to-try"}>
                <option value="want-to-try">Want to try</option><option value="tried">Tried</option><option value="keep">Keeper</option><option value="not-for-me">Not for me</option>
              </select>
            </label>
            <label className="field">Spice level
              <select name="spiceLevel" defaultValue={formRecipe?.spiceLevel ?? 2}>
                <option value="0">No heat</option><option value="1">Mild</option><option value="2">Medium</option><option value="3">Hot</option>
              </select>
            </label>
            <label className="field">Prep minutes
              <input name="prepMinutes" type="number" min="0" max="1440" defaultValue={formRecipe?.prepMinutes ?? 10} />
            </label>
            <label className="field">Cook minutes
              <input name="cookMinutes" type="number" min="0" max="1440" defaultValue={formRecipe?.cookMinutes ?? 25} />
            </label>
            <label className="field">Servings
              <input name="servings" type="number" min="1" max="100" defaultValue={formRecipe?.servings ?? 2} />
            </label>
            <label className="field">Last cooked
              <input name="lastCookedAt" type="date" defaultValue={formRecipe?.lastCookedAt ?? ""} />
            </label>

            <label className="field field-wide">Ingredients <small>One per line</small>
              <textarea name="ingredients" required rows={7} defaultValue={formRecipe?.ingredients?.join("\n")} placeholder={"1 cup toor dal\n2 tomatoes, chopped\n1 tsp cumin seeds"} />
            </label>
            <label className="field field-wide">Method <small>One step per line</small>
              <textarea name="steps" required rows={8} defaultValue={formRecipe?.steps?.join("\n")} placeholder={"Rinse and soak the dal for 20 minutes.\nPressure cook for 3 whistles.\nFinish with a hot cumin tadka."} />
            </label>
            <label className="field field-wide">Kitchen notes
              <textarea name="notes" rows={4} maxLength={2000} defaultValue={formRecipe?.notes} placeholder="Substitutions, flame level, pressure-cooker whistles, or what you would change next time…" />
            </label>
            <label className="field field-wide">Original recipe link
              <input name="sourceUrl" type="url" maxLength={500} defaultValue={formRecipe?.sourceUrl} placeholder="Instagram, blog or video link" />
            </label>
            <div className="field field-wide nutrition-heading"><strong>Nutrition per serving</strong><small>Optional — add values from a trusted label or calculation so the meal planner can compare recipes.</small></div>
            <label className="field">Energy (kcal)
              <input name="calories" type="number" min="0" max="10000" defaultValue={formRecipe?.calories ?? ""} />
            </label>
            <label className="field">Protein (g)
              <input name="proteinGrams" type="number" min="0" max="500" defaultValue={formRecipe?.proteinGrams ?? ""} />
            </label>
            <label className="field">Fibre (g)
              <input name="fibreGrams" type="number" min="0" max="200" defaultValue={formRecipe?.fibreGrams ?? ""} />
            </label>
            <label className="field">Your rating
              <select name="rating" defaultValue={formRecipe?.rating ?? ""}>
                <option value="">Not rated yet</option><option value="1">★</option><option value="2">★★</option><option value="3">★★★</option><option value="4">★★★★</option><option value="5">★★★★★</option>
              </select>
            </label>
          </div>

          {message && <p className="form-error" role="alert">{message}</p>}
          <div className="dialog-actions">
            <button className="button button-quiet" type="button" onClick={() => formDialog.current?.close()}>Cancel</button>
            <button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save recipe"}</button>
          </div>
        </form>
      </dialog>

      <dialog className="recipe-dialog detail-dialog" ref={detailDialog} onClose={() => setSelected(null)}>
        {selected && (
          <article>
            <div className={`detail-hero art-${(selected.mealTypes[0] || "Dinner").toLowerCase()}`}>
              <span className="meal-emoji" aria-hidden="true">{mealEmoji[selected.mealTypes[0]] || "🍽️"}</span>
              <button className="icon-button light" aria-label="Close" onClick={() => detailDialog.current?.close()}>×</button>
              <span className={`status-badge status-${selected.status}`}>{statusLabels[selected.status]}</span>
            </div>
            <div className="detail-body">
              <p className="card-kicker"><span>{selected.cuisine} · {selected.diet}</span><SpiceLevel level={selected.spiceLevel} /></p>
              <h2>{selected.title}</h2>
              {selected.description && <p className="detail-description">{selected.description}</p>}
              <div className="detail-facts">
                <span><b>{selected.prepMinutes}</b> min prep</span>
                <span><b>{selected.cookMinutes}</b> min cook</span>
                <span><b>{selected.servings}</b> servings</span>
                {selected.calories !== null && <span><b>{selected.calories}</b> kcal</span>}
                {selected.proteinGrams !== null && <span><b>{selected.proteinGrams}g</b> protein</span>}
                {selected.fibreGrams !== null && <span><b>{selected.fibreGrams}g</b> fibre</span>}
                {selected.rating && <span><b>★ {selected.rating}</b> rating</span>}
              </div>
              <div className="recipe-columns">
                <section>
                  <h3>Ingredients</h3>
                  <ul>{selected.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul>
                </section>
                <section>
                  <h3>Method</h3>
                  <ol>{selected.steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol>
                </section>
              </div>
              {selected.notes && <aside className="kitchen-note"><strong>From your kitchen notebook</strong><p>{selected.notes}</p></aside>}
              {selected.sourceUrl && <p className="recipe-source"><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open the original recipe <span aria-hidden="true">↗</span></a></p>}
              {selected.lastCookedAt && <p className="last-cooked">Last cooked {dateLabel(selected.lastCookedAt)}</p>}
              <div className="dialog-actions detail-actions">
                <button className="button danger-button" type="button" disabled={busy} onClick={removeRecipe}>Remove</button>
                <button className="button button-outline" type="button" onClick={editSelected}>Edit notes</button>
              </div>
            </div>
          </article>
        )}
      </dialog>
    </main>
  );
}
