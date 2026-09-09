# Decision log

## 2026-08-25 — Build the first Rasoi Notes release as a private recipe journal

**Context**

The project began as an empty repository. The requested product is a personal place to add recipes, view them as cards, track experiments, and cover Indian cooking alongside breakfast, lunch, dinner, snacks, baking and drinks.

**Options considered**

1. A public recipe publishing site.
2. A large meal-planning platform with shopping lists, nutrition and social sharing.
3. A focused private recipe box with a cooking journal.

**Decision**

Build option 3. The first release supports recipe cards; full ingredients and methods; multiple meal types; Indian cuisine, diet and spice details; search and filters; want-to-try/tried/keeper status; ratings; last-cooked dates; and personal kitchen notes.

**Rationale**

This directly supports the real workflow described by the owner: remembering new dishes, learning from each attempt and identifying recipes worth repeating. It also keeps entry fast enough to use regularly.

**Rejected alternatives**

The public publishing model does not help with private experimentation. Meal plans, groceries, nutrition, automatic importing, image uploads, social features and AI suggestions add data, permissions and interface work before their value is proven.

**Trade-offs**

The first release has one private collection and text-first cards with category artwork rather than uploaded photos. Recipe components are stored as ordered JSON lists within a structured D1 record; this is simple for a personal collection but would need normalisation if cross-recipe ingredient analytics became important.

**Implementation effect**

The site uses the existing vinext/React starter, native HTML dialogs and form controls, one D1 `recipes` table, a small shared recipe data helper, and one API endpoint. No new runtime dependency was added. The starter preview was removed.

**Verification**

The generated migration was inspected against the 18-column schema. The final production build completed successfully and reported the `/` page plus `/api/recipes` route. Two focused recipe-input checks passed: one verifies normalisation at the save boundary and one verifies that incomplete recipes are rejected. The generated social preview was inspected and its two required text lines were correct.

**Consequences**

The app can be used immediately as a private cooking journal. Photo uploads, multi-user ownership and automated importing remain outside the current data model.

**Reversal path**

R2 can be added later for photos; an owner identifier can be added if multi-user access is needed; and ingredients can be normalised into related tables if analytics or grocery aggregation becomes a demonstrated requirement.

## 2026-09-02 — Rename the product to Kitchen Katha

**Context**

The owner no longer wanted the Rasoi Notes name and selected Kitchen Katha after reviewing alternatives.

**Options considered**

Keep the existing name, rename only the on-page heading, or rename the product consistently across the interface, metadata, documentation, hosted Site and social preview.

**Decision**

Rename the product consistently to Kitchen Katha while preserving its existing recipe data, features, private access and visual direction.

**Rationale**

Kitchen Katha better expresses the personal stories and learning recorded through repeated cooking. A complete rename avoids conflicting names in browser tabs, shared links and project documentation.

**Rejected alternatives**

Keeping Rasoi Notes conflicts with the owner’s explicit choice. A display-only rename would leave stale branding in link previews and hosting metadata.

**Trade-offs**

Changing the hosted slug changes the production URL, so any saved bookmark using the old name may need to be replaced.

**Implementation effect**

Update the visible brand, accessible label, page and social metadata, package name, README, hosted title, hosted slug and social-preview image. No product behaviour or database schema changes.

**Verification**

The production build completed successfully and both recipe-input boundary tests passed on 2026-09-03. The hosted title and slug were updated, and the private deployment was prepared from the same verified source state.

**Consequences**

The product presents one consistent Kitchen Katha identity while keeping all existing recipes and storage intact.

**Reversal path**

Restore the previous text, metadata, package name, hosted title, slug and social-preview asset, then publish a new version.

## 2026-09-04 — Present saved recipes as a card drawer

**Context**

The owner wanted saved recipes to feel like physical cards arranged in a drawer, with each card name still visible and only the selected recipe shown after it is pulled out.

**Options considered**

Keep the three-column grid, add a drag-driven carousel, or restyle the existing cards as an overlapping drawer with labelled buttons that open the existing focused recipe dialog.

**Decision**

Use the existing card and dialog flow. Display the filtered recipes as an overlapping stack with a visible, tappable label for every recipe; keep the newest recipe at the front and open any selected card in the existing single-recipe dialog.

**Rationale**

This delivers the physical recipe-drawer metaphor without changing recipe data or adding gesture libraries. Native buttons keep every visible card label usable by touch and keyboard, while the existing modal already provides the requested one-card-only reading view.

**Rejected alternatives**

The old grid did not match the requested drawer interaction. A carousel or drag-only interface would add code and make access harder for keyboard users without improving the core task.

**Trade-offs**

The drawer grows vertically as recipes are added. Search and filters remain the fast way to reduce a large stack; pagination or virtualisation should be considered only if real usage makes the drawer unwieldy.

**Implementation effect**

Reuse the existing recipe component and dialog, reverse the filtered display order so the newest card is at the front, add a semantic button to each exposed card edge, and implement the overlapping desktop and mobile layout in CSS. No dependency, API, schema or storage change is required.

**Verification**

The local route returned HTTP 200, the production build completed successfully, focused lint passed, and both recipe-input boundary checks passed on 2026-09-04.

**Consequences**

Kitchen Katha now presents the recipe collection as a tactile drawer while preserving search, filters, editing, removal and focused recipe reading.

**Reversal path**

Restore the previous grid wrapper and grid/card styles; no data migration or recipe restoration would be needed.

## 2026-09-05 — Separate the homepage from the recipe drawer and centre dialogs

**Context**

The owner wanted the homepage to remain a focused welcome screen, with the recipe box on another page, and wanted opened recipe cards to be presented centrally.

**Options considered**

Keep the single long page with an anchor link, create a dedicated recipe route while reusing the current journal component, or split the interface into multiple new components and layouts.

**Decision**

Keep the welcome experience at `/`, move the searchable recipe drawer to `/recipes`, reuse the existing journal component in a simple home-or-recipes mode, and explicitly centre both native dialogs within the viewport.

**Rationale**

A dedicated route cleanly separates welcoming from browsing while preserving one implementation for adding and viewing recipes. Native routing and dialog behaviour cover the requirement without a new dependency or duplicated feature flow.

**Rejected alternatives**

An anchor link would leave the recipe box on the homepage. Separate page-specific journal components would duplicate state, forms and API behaviour for no user benefit.

**Trade-offs**

Opening the drawer now involves one navigation step. The persistent Recipe drawer or Home link keeps that step obvious, and direct bookmarks to `/recipes` remain possible.

**Implementation effect**

The homepage no longer loads recipe records or renders the recipe section. A new server-rendered `/recipes` page loads the existing D1 collection. The shared header uses native links for reliable Vinext navigation, and dialogs use fixed viewport positioning, automatic margins and internal scrolling for long content.

**Verification**

Both `/` and `/recipes` returned HTTP 200 locally. The production build completed successfully, focused lint passed, and both recipe-input boundary checks passed on 2026-09-05.

**Consequences**

Kitchen Katha has a cleaner homepage, a directly addressable recipe workspace and consistently centred add/edit and recipe-detail popups without changing stored recipes.

**Reversal path**

Render both sections from the homepage again, remove the `/recipes` route and restore the previous dialog positioning; no data migration would be required.

## 2026-09-05 — Add reviewed Instagram imports and evidence-informed meal planning

**Context**

The owner wants to save recipes discovered on Instagram without manually reformatting each caption, and to arrange drawer recipes into balanced, weight-loss or weight-gain weeks using health properties. Because weight change is a health-related topic, the planning principles need traceable research and cautious boundaries.

**Options considered**

1. Scrape and immediately save any Instagram link, and use fixed personal calorie prescriptions.
2. Require a Meta API login and professional Instagram account before any import can work.
3. Read public caption metadata when available, offer pasted caption text when Instagram gates it, open every parsed draft for review, and rank the owner’s recipes with transparent non-clinical rules supported by primary research.

**Decision**

Use option 3. Add optional source URL, calories, protein and fibre per serving to the existing recipe record. The importer accepts only a secure Instagram post/reel URL, reads public metadata server-side without following redirects, or parses an owner-pasted caption, and never saves automatically. Add `/planner` with seven-day balanced, weight-loss and weight-gain arrangements, a dietary filter, plan shuffling, visible nutrition completeness, scoring explanations, safety guidance and links to eight supporting trials or systematic reviews plus WHO and NHS guidance.

**Rationale**

Instagram’s supported APIs require credentials and do not provide universal access to arbitrary private or login-gated posts. A public-metadata attempt plus caption fallback gives the owner a useful flow without bypassing privacy controls. Review-before-save prevents a formatting guess from becoming trusted recipe data. For meal planning, energy balance, protein, fibre, food quality, minimally processed foods and dietary adherence have stronger evidence than branding one macronutrient split as universally best; transparent ranking is safer than pretending the app can prescribe a personal diet.

**Rejected alternatives**

Automatic saving was rejected because captions are inconsistent and a wrong quantity or cooking step could matter. A Meta-login-only flow was rejected because it would add credentials and still not unlock arbitrary content. Personal calorie targets, promised rates of weight change and ingredient-derived nutrition estimates were rejected because the app lacks the clinical and body-composition data needed to calculate them safely.

**Trade-offs**

Instagram imports can fail when a post is private, login-gated or changes its metadata, so pasted captions remain necessary. The deterministic parser works best with explicit Ingredients and Method headings. The planner is only as accurate as the per-serving values the owner enters, and many saved recipes will initially have missing nutrition. Evidence for deliberate weight gain is thinner and smaller-scale than evidence for weight loss and cardiovascular dietary patterns.

**Implementation effect**

Extend the single D1 table by four columns and add a generated migration. Reuse the existing recipe form and save endpoint, add one SSRF-constrained Instagram import endpoint and a small caption parser, and add a client planner backed by a pure ranking function. No dependency, account, media storage, external AI service or second database is added. Three focused Node test files cover save-boundary normalisation, Instagram parsing/URL restrictions and goal-dependent planning.

**Verification**

On 2026-09-05 all six focused tests passed, including an end-to-end local pasted-caption request that returned a correctly structured Masala Chai draft. Focused lint passed. `/`, `/recipes` and `/planner` each returned HTTP 200 locally. The four-statement Drizzle migration was generated and inspected, and the production build completed with the homepage, recipe API, Instagram import API, recipe drawer and planner routes.

**Consequences**

The owner can turn a public Instagram recipe or copied caption into a reviewed drawer card, enrich recipes with basic nutrition, and produce a research-explained weekly arrangement from existing recipes. The planner clearly separates organisation from medical treatment and keeps source papers available within the site.

**Reversal path**

Remove the importer route and UI, planner route and ranking helper, and the four new recipe fields from future code. Existing values can be left harmlessly in D1 or removed in a separately reviewed table-rebuild migration; recipe titles, methods and journal data remain independent.

## 2026-09-09 — Make Instagram importing a one-step automatic save

**Context**

The owner clarified that the Instagram feature should not prepare a draft or require any manual caption entry or review. The intended interaction is one action: paste a link and receive a completed recipe card in the drawer.

**Options considered**

1. Keep the review form and caption fallback.
2. Add a paid video-download, transcription, OCR and language-model pipeline.
3. Reuse the existing public-caption parser and recipe persistence path, but make the server validate and save the extracted recipe immediately.

**Decision**

Use option 3. Read Instagram’s public captioned embed first, fall back to the public post metadata, require both a recognisable ingredient section and method section, save the parsed recipe through the existing validation boundary, and return the completed record. The client adds it to the drawer and opens the saved card automatically. Repeated links return the existing card instead of creating a duplicate.

**Rationale**

This is the shortest complete implementation of the requested zero-manual-entry flow and reuses the parser, database model and card UI already present. It does not require a new service, credential or dependency. Rejecting incomplete captions is safer than inventing quantities or cooking instructions. Instagram’s official API still requires access tokens and centres professional-account media, so public embed content is the credential-free source available to this private site.

**Rejected alternatives**

The review form contradicts the clarified interaction and was removed. A full video-analysis system was rejected for this change because it would require media acquisition plus external transcription, OCR and AI credentials, and it would materially expand cost, privacy and failure modes. Saving partial or guessed recipes was rejected because an apparently complete but incorrect cooking card is worse than a clear import failure.

**Trade-offs**

The import is fully automatic when a public caption contains a labelled ingredient list and method. It cannot extract details that exist only in a reel’s narration, frames, comments or a private/login-gated post. Instagram can change its public embed markup, so the extractor also retains a metadata fallback and has a focused HTML extraction check.

**Implementation effect**

Move HTML caption extraction into the existing pure parser, support current share-link shapes including plural and handle-prefixed reel URLs, and change the import endpoint to deduplicate, validate and create the recipe. Remove the imported-draft client state, caption textarea and review-dialog branch. Keep the existing manual Add recipe form unchanged. No schema, migration or dependency change is required.

**Verification**

On 2026-09-09 all eight focused tests passed, including current share-link normalisation and public-embed caption extraction. Focused lint passed, the recipe drawer returned HTTP 200 locally, and the production build completed with the existing five routes. The private release was then published successfully.

**Consequences**

For supported public recipe posts, one pasted link now produces and opens a saved recipe card with no manual copying or form completion. Unsupported or incomplete posts produce an error and leave the drawer unchanged.

**Reversal path**

Restore the previous draft response, imported-form state and review dialog. Stored recipes need no migration because both workflows use the same recipe table.

## 2026-09-09 — Use the edge runtime’s supported manual redirect mode for Instagram

**Context**

The public reel `Db_AiWMpcF3` contained a complete caption, but Kitchen Katha reported that Instagram had not made it public. Reproducing the import through the real local route showed that the Cloudflare-compatible runtime rejected `redirect: "error"` before making any Instagram request; that redirect mode is not implemented at the edge.

**Options**

Keep the unsupported mode and replace the request layer, allow automatic redirect following, or use the runtime-supported manual mode and continue accepting only successful responses from the already validated Instagram URL.

**Decision**

Change the shared Instagram request from `redirect: "error"` to `redirect: "manual"`.

**Rationale**

This is the smallest root-cause fix. Manual redirect handling is supported by the deployment runtime, retains the existing trust boundary, and avoids silently following an external redirect. No parser, dependency or data-model change is needed.

**Rejected alternatives**

Replacing the request layer would add infrastructure for one unsupported option. Automatic redirect following was unnecessary because the canonical public caption endpoint returns a successful response directly. Adding another Instagram HTML parser fallback was also rejected after the runtime error proved that parsing had never started.

**Trade-offs**

A future Instagram endpoint that requires a redirect will be skipped rather than followed. The importer already tries the canonical post page next, and a future redirect can be validated explicitly if real evidence requires it.

**Implementation effect**

One request option changes in the existing import endpoint. The recipe parser, automatic-save flow, database and interface remain unchanged.

**Verification**

All eight focused tests and focused lint passed, and the production build completed. The reported reel then passed through the real import route with HTTP 201, producing the `creamy afghani chicken` card with 22 ingredient lines and 10 method steps.

**Consequences**

Public Instagram captions can now reach the existing extractor in the edge-compatible runtime instead of failing before the network request.

**Reversal path**

Restore the previous redirect option only if the hosting runtime gains support for it; no stored data or migration is involved.
