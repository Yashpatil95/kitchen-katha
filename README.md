# Kitchen Katha

Kitchen Katha is a mobile-friendly recipe box and cooking journal. The hosted application and its saved recipes remain private to the owner, while the source code is public. It is designed around a simple loop: save a recipe, cook it, record what changed, and decide whether it is worth keeping.

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
- Instagram post/reel importing that extracts complete public-caption recipes automatically, with manual caption, narration, image-text and comment-note inputs
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

## Source repository

The source code is public at [Yashpatil95/kitchen-katha](https://github.com/Yashpatil95/kitchen-katha). The deployed Sites application remains owner-private, and its production recipe database is not stored in this repository.

## Instagram imports

On the recipe drawer page, paste the link to one public Instagram post or reel and choose **Add to drawer**. Kitchen Katha reads the public embed caption, recognises common headings such as `Ingredients for 2`, `Method`, `How to make` and `Preparation`, sorts bullets or numbered lines into the normal format, saves the recipe, and opens the finished card automatically. Repeating the same link opens the existing card instead of creating a duplicate, including when two import requests arrive together.

For fully automatic import, the post must be public and its caption must contain a recognisable ingredient list and method. If the recipe is spoken in the Reel, open **Recipe is in the Reel narration?** and paste a transcript. If recipe text appears in images, open **Recipe is written in images or comments?** and paste the visible words. Kitchen Katha still tries the public caption first, then uses narration and image text in that order to fill missing sections. The text areas remain editable until you submit them. If Instagram blocks the caption request, the form also offers a caption box. All three recipe-text sources use the same parser and validation path. If only part of a recipe can be recognised, Kitchen Katha opens an editable draft, keeps the useful fields and highlights the missing ingredient or method section instead of silently discarding it.

Useful comments may be pasted separately. They are saved under **Comments (unverified)** in the recipe notes and are never interpreted as ingredients or cooking steps. Kitchen Katha does not listen to, download or transcribe the Reel, inspect images, run OCR or collect comments automatically. These manual inputs use no transcription or OCR credits. The importer does not bypass privacy controls or invent missing quantities, servings, times, diet labels or nutrition. Values absent from the supplied text appear as **Not stated** or **Unknown** and can be edited later.

The narration flow accepts one owner-supplied audio or video file up to 20 MB and five minutes, requires explicit upload consent, makes one protected request to a separate Cloudflare Worker using `@cf/openai/whisper-large-v3-turbo`, and places the returned text in the editable transcript field without parsing or saving a recipe. The app route rejects oversized request bodies before multipart parsing and stays disabled unless `NARRATION_TRANSCRIPTION_ENABLED=true`, `CLOUDFLARE_TRANSCRIPTION_URL`, and the server-side `CLOUDFLARE_TRANSCRIPTION_SECRET` are configured. The owner-only live Site uses Cloudflare's free daily Workers AI allocation; a synthetic 14.7-second English cooking narration was transcribed successfully on 2026-10-06.

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

Kitchen Katha remains a single private recipe collection. Instagram imports use the post’s public embed caption or owner-pasted caption, narration transcript, image text and useful comments; they do not use a Meta login, inspect Instagram video, audio or images, collect comments, or attempt to read private posts. The experimental owner-upload narration control remains server-disabled and mock-verified only. Nutrition is recorded manually rather than calculated from ingredients. Automatic OCR, grocery lists, saved planner histories, sharing and multi-user accounts remain deferred until real use shows which is valuable.
