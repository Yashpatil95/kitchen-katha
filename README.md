# Kitchen Katha

Kitchen Katha is a private, mobile-friendly recipe box and cooking journal. It is designed around a simple loop: save a recipe, cook it, record what changed, and decide whether it is worth keeping.

## What exists

- A stacked recipe drawer with labelled card edges and a focused single-recipe view
- A separate `/recipes` workspace, reached from the uncluttered homepage
- Search, meal-type filters and cooking-stage filters
- Add, edit, view and remove flows
- Indian-food-friendly cuisine, diet, spice, pressure-cooker and personal-note fields
- Multiple meal types for recipes that fit more than one part of the day
- Want to try, tried, keeper and not-for-me stages
- Ratings and last-cooked dates
- Durable Cloudflare D1 storage
- Responsive, keyboard-accessible dialogs and forms

## Run locally

Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The homepage is available at `/`; the complete recipe drawer is available at `/recipes`.

The local database table is created automatically when the site first loads. Generate a migration after schema changes:

```bash
npm run db:generate
```

Verify a production build and the rendered-page check:

```bash
npm run build
node --test tests/recipe-input.test.mjs
```

## Current scope

This first version is a single private recipe collection. Photo uploads, recipe importing, meal planning, grocery lists, nutrition calculations, sharing and multi-user accounts are intentionally deferred until real use shows which of them is valuable.
