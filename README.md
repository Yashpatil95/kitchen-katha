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
- One-step Instagram post/reel importing that extracts and saves complete public-caption recipes automatically
- Optional per-serving energy, protein and fibre fields on every recipe
- An evidence-informed seven-day meal planner for balanced eating, weight loss or weight gain
- A plain-language research library linking to the supporting trials and reviews

## Run locally

Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The homepage is available at `/`, the complete recipe drawer at `/recipes`, and the meal planner at `/planner`.

## Instagram imports

On the recipe drawer page, paste the link to one public Instagram post or reel and choose **Add to drawer**. Kitchen Katha reads the public embed caption, sorts its ingredients and method into the normal format, saves the recipe, and opens the finished card automatically. Repeating the same link opens the existing card instead of creating a duplicate.

The post must be public and its caption must contain a recognisable ingredient list and method. Instagram links whose recipe exists only in video narration or on-screen text cannot be converted by this caption-only importer; nothing is saved when the source is incomplete. The importer does not bypass privacy controls, download media or invent missing quantities and instructions.

## Meal planning and health limits

The planner ranks recipes already in the drawer. Weight-loss plans favour protein and fibre with a gentle energy check; weight-gain plans favour energy and protein; balanced plans favour protein, fibre and variety. Keeper and tried recipes get a small reliability boost. Add nutrition per serving to each recipe for a more useful comparison—these values are user-entered and are not independently verified.

The planner is an organisational aid, not medical advice, a diagnosis or a personal calorie prescription. Its research page links directly to the supporting randomised trials, systematic reviews and public-health guidance, explains the sorting rules, and identifies circumstances where a GP or registered dietitian should guide changes.

The local database table is created automatically when the site first loads. Generate a migration after schema changes:

```bash
npm run db:generate
```

Verify a production build and the rendered-page check:

```bash
npm run build
node --test tests/*.test.mjs
```

## Current scope

Kitchen Katha remains a single private recipe collection. Instagram imports use the post’s public embed caption; they do not use a Meta login, inspect video/audio or attempt to read private posts. Nutrition is recorded manually rather than calculated from ingredients. Photo uploads, video transcription, grocery lists, saved planner histories, sharing and multi-user accounts remain deferred until real use shows which is valuable.
