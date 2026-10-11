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

Comments may be pasted one per line. Kitchen Katha shows each line separately and saves only the lines you select under **Comments (unverified)** in the recipe notes; they are never interpreted as ingredients or cooking steps. It does not collect Instagram comments automatically. This manual workflow uses no API credits and does not bypass privacy controls.

### Meta comments eligibility (Step 19)

Meta's official comments API is suitable only when both conditions are true:

- the connected Instagram account is a **Business or Creator** account; and
- that account **owns the post or Reel** whose comments will be read.

It does not provide comments for arbitrary recipe posts owned by other creators, even when those posts are public. Kitchen Katha's pasted-comments selector therefore remains the supported workflow for third-party recipes.

For owned media, the smallest current setup is Instagram API with Instagram Login:

1. Confirm the Instagram profile is Business or Creator in Instagram account settings.
2. Confirm each target post or Reel appears on that same profile. Do not continue for third-party media.
3. Create a Meta developer app and add the Instagram API product. No Facebook Page link is required for Instagram Login.
4. Configure an exact HTTPS OAuth redirect URI for Kitchen Katha.
5. Request only `instagram_business_basic` and `instagram_business_manage_comments`.
6. While the app is in development, add the owner as an app tester and grant access from the professional Instagram account.
7. Complete Instagram Login and keep the access token server-side; never place it in browser code, logs or the public repository.
8. List the authenticated account's media, match the submitted Instagram URL to an owned media ID, and reject URLs that cannot be matched.
9. Read comments from that owned media ID using bounded cursor pagination. Keep a strict result cap and show comments unchecked for review.
10. Before serving anyone outside app roles, complete the Meta review and access level required for the requested permissions.

The older Facebook Login route remains possible but additionally requires a Facebook Page linked to the professional Instagram account and permissions including `pages_show_list`, `pages_read_engagement`, `instagram_basic` and `instagram_manage_comments`. Kitchen Katha should prefer Instagram Login because it needs fewer account dependencies. No Meta app, account conversion, OAuth connection or token was created in Step 19.

Sources checked on 2026-10-07: [Meta's Instagram API with Instagram Login](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login) and [Meta's Instagram API with Facebook Login](https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login).

The narration flow accepts one owner-supplied audio or video file up to 20 MB and five minutes, requires explicit upload consent, makes one protected request to a separate Cloudflare Worker using `@cf/openai/whisper-large-v3-turbo`, and places the returned text in the editable transcript field without parsing or saving a recipe. The app route rejects oversized request bodies before multipart parsing and stays disabled unless `NARRATION_TRANSCRIPTION_ENABLED=true`, `CLOUDFLARE_TRANSCRIPTION_URL`, and the server-side `CLOUDFLARE_TRANSCRIPTION_SECRET` are configured. The owner-only live Site uses Cloudflare's free daily Workers AI allocation; a synthetic 14.7-second English cooking narration was transcribed successfully on 2026-10-06, and the enabled upload, consent and review controls were verified in the live Site at a 390 × 844 phone viewport.

For recipe words displayed inside a Reel, the image-evidence section accepts one local video up to 20 MB and five minutes and creates six evenly spaced thumbnail previews with the browser's native video and canvas features. Up to four generated frames can be selected, or up to four screenshots/images of 5 MB each can be previewed; both paths share one four-image limit. The video and previews remain in the current browser session, and the visible recipe words can be entered in the existing manual text box. This flow does not upload media, call OCR or use AI credits.

The importer clearly labels these file controls as **Upload media you are allowed to use**. Choose only saved video, audio or screenshots you created or have permission to process. Kitchen Katha does not request Instagram passwords, reuse session cookies or download private posts. Selecting a file alone keeps it in the browser; external processing still requires its separate consent action.

Raw media is request-scoped rather than stored: the browser releases original file selections after creating local previews or receiving processed text, clears generated image previews after successful reading, and revokes temporary media URLs. Processing routes return only bounded text, have no D1 write path and do not log request bodies, files or generated media. D1 stores only the final structured recipe fields and user-reviewed notes.

A protected `/api/read-images` boundary is prepared for later automatic OCR. It accepts one multipart batch of one to four images, limits each image to 5 MB and the whole batch to 20 MB, requires explicit credit consent, and returns bounded editable text. The interface exposes a separate **Read selected images — uses API credits** action; successful text fills the existing editable image-text box and never saves a recipe automatically. The route remains disabled unless `IMAGE_OCR_ENABLED=true`, `IMAGE_OCR_URL` and the server-side `IMAGE_OCR_SECRET` are configured. Cloudflare Workers AI with `@cf/meta/llama-3.2-11b-vision-instruct` was validated separately on 2026-10-06 with one synthetic Paneer Tikka image: every visible recipe word, quantity and step was recovered, the dashboard reported `0/10k` neurons used that day, and no cash charge was incurred. The test Worker was made inert immediately afterwards. Production remains provider-disabled; no OCR secret, endpoint or Site deployment was added.

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

Kitchen Katha remains a single private recipe collection. Instagram imports use the post’s public embed caption or owner-pasted caption, narration transcript, image text and useful comments; they do not use a Meta login, download Instagram media, collect comments, or attempt to read private posts. Owner-supplied video can be inspected locally to create and select frame previews, owner-supplied screenshots can be previewed locally, and owner-supplied narration can be sent explicitly to the protected Cloudflare transcription Worker. Automatic image reading is wired and its proposed Cloudflare model has passed one synthetic accuracy/cost checkpoint, but production stays disabled until a protected endpoint and secret are deliberately configured and deployed. Nutrition is recorded manually rather than calculated from ingredients. Grocery lists, saved planner histories, sharing and multi-user accounts remain deferred until real use shows which is valuable.

Step 26 validation originally found one medium issue and two low issues. The release fix now matches either of the owner identities supplied by Sites—the configured account ID or verified email—before any page, recipe or provider handler, applies D1-backed per-minute limits to Instagram import and AI routes, streams JSON through application byte limits before parsing, hides unexpected storage errors, configures official Cloudflare Worker types, and gives the pulled recipe card an explicit accessible name. The complete 50-test suite, production build, standalone TypeScript check and lint all pass; lint retains only the two intentional local-preview image warnings. Keep the hosted application owner-private: this one-owner boundary is not a multi-user or public-catalogue authorization model.
