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

## 2026-09-26 — Make Instagram imports truthful, recoverable and race-safe

**Context**

The reported reel could be retrieved after the edge redirect fix, but the importer still treated several caption formats as incomplete, collapsed retrieval, parsing and storage failures into one response, guessed absent servings, times and diet data, discarded partial parsing work, and used a read-then-write duplicate check that could race.

**Options considered**

1. Add a paid scraping, transcription or language-model service for every Instagram link.
2. Replace the importer with Meta's authenticated API.
3. Keep the existing credential-free public-caption path, harden each stage, reuse the same parser for an owner-pasted fallback, preserve incomplete work as an editable draft, and enforce source-link uniqueness in D1.

**Decision**

Use option 3. Keep automatic import as the primary flow. Categorise invalid links, unavailable captions, upstream timeouts, oversized responses, incomplete captions and storage failures separately. Accept common heading and list variants, stop inferring missing recipe facts, offer a pasted-caption fallback only when retrieval fails, and open incomplete results in the existing editor with required gaps highlighted. Save through one conditional D1 insert and add a partial unique index for non-empty source links as a second line of defence.

**Rationale**

The public caption already contains the complete reported recipe, so a new paid service or media-processing pipeline is unnecessary. Meta's supported Instagram APIs require tokens and focus on professional-account media; they are not a credential-free extractor for arbitrary public reels. Keeping one parser and one save boundary makes the automatic and fallback paths behave consistently. Database-enforced uniqueness closes the concurrency gap that an application-only lookup cannot.

**Rejected alternatives**

A paid scraper or AI pipeline would add credentials, cost, privacy exposure and new failure modes before caption-only evidence requires it. Meta authentication would not provide universal access to arbitrary consumer posts. Continuing to reject every partial caption would lose useful work, while saving guessed values would make the recipe card look more certain than its source.

**Trade-offs**

The importer remains caption-only and cannot read narration, frames, private posts or login-gated content. A pasted caption requires one manual copy when Instagram blocks server retrieval. The existing non-null numeric columns use `0` for an imported serving or time that was not stated, and `-1` for unstated spice; the interface consistently renders those sentinels as “Not stated”. A future schema cleanup can make those columns nullable if broader data work justifies a table rebuild.

**Implementation effect**

The existing parser now handles serving-qualified, dash-suffixed and inline section headings, bullets, numbered inline steps, emoji, extra embed classes and social tag blocks. Retrieval uses an eight-second timeout, manual redirect handling and a streamed one-megabyte limit. The route returns structured error codes without logging captions. The recipe form now supports Unknown/Not stated values and imported partial drafts. One conditional `INSERT … SELECT … WHERE NOT EXISTS` makes the duplicate check and write a single database statement; a generated partial unique-index migration protects non-empty source URLs as defence in depth. No dependency, external provider, authentication flow or new table was added.

**Verification**

On 2026-09-26 the focused suite covered realistic captions, inline and dash headings, extra HTML classes, invalid URLs, public retrieval options, gated posts, timeouts, oversized responses, partial drafts, duplicates and storage failures. The reported public reel `Db_AiWMpcF3` was fetched by the new bounded retriever and parsed into 22 ingredient lines and 9 method lines with no missing required section; absent servings remained unstated. Focused lint and a production build passed before publishing. On 2026-09-27 two simultaneous local HTTP imports of a new source both resolved to one saved row after the conditional insert replaced the application-only read/write pair. Production save, duplicate and reload verification are recorded in the release handoff.

**Consequences**

Supported public captions still become recipe cards in one action. Retrieval failures now offer a usable fallback, partial captions retain the information already found, missing facts remain visibly unknown, and concurrent requests cannot create duplicate imported cards.

**Reversal path**

Remove the fallback and partial-draft client state, restore the previous parser and route, and drop `recipes_source_url_unique` in a reviewed migration. Existing recipe rows remain compatible because no stored field was removed or reinterpreted for positive values.

## 2026-09-27 — Publish the source code in a public GitHub repository

**Context**

Kitchen Katha had a local Git history and a private Sites deployment but no GitHub remote. The owner explicitly requested a public repository while keeping the working application available on Sites.

**Options considered**

1. Keep the source only in the local checkout and Sites source repository.
2. Create a private GitHub repository.
3. Create a public GitHub repository from the existing history while leaving the deployed application and its D1 recipe data private.

**Decision**

Use option 3. Publish the existing `main` history as `Yashpatil95/kitchen-katha`, set it as `origin`, and keep the Sites access policy unchanged.

**Rationale**

This matches the requested visibility without creating a second source tree or coupling source visibility to application access. Reusing the current history preserves the implementation record and provides a normal upstream for future changes.

**Rejected alternatives**

Local-only source does not provide the requested GitHub repository. A private GitHub repository conflicts with the explicit public request. Copying files into a fresh repository would discard useful history and create avoidable divergence.

**Trade-offs**

The code and commit history become visible to anyone. The production database and owner-only Sites access remain separate. Future commits must continue to keep credentials and personal recipe data out of Git.

**Implementation effect**

README documentation distinguishes the public source repository from the private hosted application. No runtime code, dependency, database schema or Sites access policy changes.

**Verification**

Before publication, tracked files and the complete Git history were checked for credential-like filenames and common credential markers, with no matches. GitHub then reported `Yashpatil95/kitchen-katha` as public with `main` as its default branch, and `origin/main` resolved to the exact local `HEAD` commit. The repository description and README also distinguish public source from the private hosted application and production data.

**Consequences**

Kitchen Katha can now be browsed and cloned publicly while the live recipes remain protected by the existing private Sites access policy.

**Reversal path**

Change the GitHub repository visibility to private or archive it, then update the README and project register. Removing the local `origin` remote is optional and does not alter the local history.

## 2026-09-27 — Bound multimodal recipe extraction by ownership, privacy and explicit credit consent

**Context**

The owner wants future imports to understand reel narration, text shown inside video or images, comments, and private or login-gated posts. This work will be applied one small step at a time and must avoid unexpected API charges, credential exposure, or bypassing Instagram access controls.

**Options considered**

1. Scrape arbitrary Instagram pages with browser sessions and automatically call paid models.
2. Build narration, OCR, comment and private-post support as one pipeline.
3. Extend the existing deterministic importer incrementally, using only public or owner-authorised source material and explicit gates for paid processing.

**Decision**

Use option 3. The existing public-caption importer remains the first path. Additional automatic extraction may use media, screenshots, text or comments deliberately supplied by the owner and permitted for use, or a future official Meta API connection for an authorised professional account and media that API permits. Kitchen Katha will not collect Instagram passwords, browser cookies or session tokens, bypass private or login controls, or scrape arbitrary private consumer content. “Private or login-gated support” means owner-supplied media they may lawfully use, or official authorised access; it does not mean defeating access restrictions.

Raw audio, video and images will be processed transiently and discarded rather than stored in D1 or application logs. API credentials belong only in hosting secrets or server environment variables, never Git, D1 or client code. Captions, transcripts, OCR text, comments, raw media and credentials must not be logged. Extracted text must remain editable and reviewable before saving a recipe. Comments are untrusted notes and must not silently become ingredients or method steps.

The deterministic parser will always run before paid processing. Manual transcript, image-text and comment entry will remain a zero-runtime-credit path. Pasting a link alone will never trigger a paid call. Transcription or OCR requires an explicit control that warns it uses API credits, makes one bounded request without automatic retry, and applies conservative media, duration, frame and comment limits. Exact provider, model, pricing and limits will be checked when that step is implemented. A real paid test requires a separate command with an explicit spending cap. Each `apply step N` command performs only that step and stops; only named checkpoint steps may commit, push or deploy unless separately authorised.

**Rationale**

This preserves the working, no-cost caption path and adds more capable extraction only when the source actually needs it. It respects Instagram's access boundary, keeps private cooking media out of persistent storage, and makes every charge a visible user choice. ChatGPT subscription usage and API billing are separate, so an explicit API gate prevents the project from treating them as one allowance.

**Rejected alternatives**

Password, cookie or session capture and private-access bypasses are unsafe and outside the product boundary. Always-on AI would spend credits on captions the existing parser can already handle. Persisting raw media would add storage, retention and deletion obligations before a real need exists. Automatically merging comments into recipes would treat untrusted discussion as verified cooking instructions.

**Trade-offs**

Some imports will require the owner to upload media, paste text, review extracted content or connect an eligible professional account. Arbitrary private posts and complete comment threads will not become universally importable. Incremental delivery takes more checkpoints, but each change remains small, testable, reversible and cost-controlled.

**Implementation effect**

This step changes governance documentation only. It does not change application code, schema, dependencies, provider configuration, secrets, interface, deployment or access policy. The current caption importer remains unchanged.

**Verification**

The repository diff was checked to confirm that this decision and the central project-register entry are the only intended edits. `git diff --check` passed. No application test or paid external call was needed because runtime behaviour did not change.

**Consequences**

All later multimodal-import steps inherit these source, privacy and credit rules. Live paid tests need separate, precisely bounded approval. The first implementation step can refactor the existing caption parser without contacting an external model.

**Reversal path**

Replace this decision before multimodal implementation begins. Because this step creates no runtime artifact, provider account, stored media or migration, reversal requires documentation edits only.

## 2026-09-27 — Separate recipe-text parsing from Instagram retrieval

**Context**

Narration transcripts, OCR output and owner-supplied text will eventually need the same deterministic recipe parsing already used for Instagram captions. That parsing was embedded in the Instagram retrieval module, which would make each later source depend on Instagram-specific code.

**Options considered**

1. Copy the caption parser for each future text source.
2. Wait until the first paid media integration before separating the parser.
3. Move the existing deterministic logic into one source-neutral pure-text module and keep a thin Instagram adapter for its existing metadata and error contract.

**Decision**

Use option 3. `parseRecipeText` now owns heading recognition, ingredient and method extraction, truthful defaults, meal and diet hints, size limits and incomplete-field warnings. It accepts optional caller-supplied fallback title, notes and source URL without fetching data or knowing which source produced the text. `parseInstagramCaption` supplies Instagram provenance and translates generic parser failures back to the existing Instagram error codes.

**Rationale**

One deterministic parser is the smallest reusable foundation for captions, manual transcripts and later OCR. Keeping retrieval and parsing separate prevents future media paths from duplicating business rules, while the adapter preserves the current route response and saved recipe behaviour.

**Rejected alternatives**

Duplicating the parser would let source behaviours drift. Deferring the separation would mix structural refactoring into a later provider integration and make that paid step harder to verify. A parser interface or provider hierarchy was unnecessary because there is one pure function and one current caller.

**Trade-offs**

The parser is now one additional module, and Instagram-specific validation errors require a small translation boundary. Its existing deterministic heuristics remain intentionally limited; this step does not claim to understand free-form narration without recognisable ingredient and method sections.

**Implementation effect**

Parsing logic moved from `db/instagram-recipe.mjs` to `db/recipe-text.mjs`. The Instagram importer calls it through the existing `parseInstagramCaption` adapter. Focused parser tests moved to `tests/recipe-text.test.mjs`, while Instagram tests retain provenance, error-contract, retrieval and save-flow coverage. No dependency, external model, API call, database change, interface change or deployment was added.

**Verification**

Thirteen focused recipe-text and Instagram importer tests passed. Focused ESLint and `git diff --check` also passed. No external or paid service was contacted.

**Consequences**

Later owner-supplied transcripts or OCR text can reuse the same tested parser without importing Instagram retrieval concerns. Current caption imports keep their existing output and errors.

**Reversal path**

Move the parsing constants and function back into `db/instagram-recipe.mjs`, remove its adapter and restore the former focused tests. No stored data or migration is involved.

## 2026-09-27 — Merge recipe evidence by trusted source priority

**Context**

Future imports may contain overlapping recipe text from a public caption, an owner-supplied narration transcript and text read from selected images. Comments may contain useful tips, but they are untrusted discussion and must not silently become cooking instructions.

**Options considered**

1. Concatenate every source and parse the combined text once.
2. Parse captions, transcripts, image text and comments as equal recipe evidence.
3. Parse caption, transcript and image text independently, then fill missing recipe fields in that priority order while preserving comments only as labelled notes.

**Decision**

Use option 3. `mergeRecipeEvidence` prefers the first usable title or complete field in this order: caption, transcript, image text. A later source fills a field only when earlier sources did not state it. Ingredient and method sections are selected as whole sections rather than combined line by line. Comment text is appended under `Comments (unverified)` and is never passed to the recipe parser. Comment-only input cannot create a recipe draft.

**Rationale**

Independent parsing prevents a second source's title or headings from being mistaken for ingredients in an incomplete first source. Whole-section priority is deterministic, avoids duplicate lines and preserves the public caption as the primary account. Keeping comments outside the parser enforces the trust boundary in one shared function rather than relying on every future caller.

**Rejected alternatives**

Raw concatenation breaks section boundaries when one source is incomplete. Treating comments as recipe evidence could turn guesses, corrections or malicious text into ingredients and instructions. Item-level similarity and reconciliation were not added because no real example yet justifies that complexity.

**Trade-offs**

When two sources contain different useful lines within the same ingredient or method section, the higher-priority complete section wins and the lower-priority lines are not merged automatically. The resulting draft remains reviewable, and item-level reconciliation can be added later if real imports show repeated loss of complementary details.

**Implementation effect**

The shared pure-text module now exports `mergeRecipeEvidence`. The existing Instagram caption adapter uses it with one caption, proving the merger on the current route without changing user-visible behaviour. Transcript, image-text and comment inputs are not yet accepted by the API or interface. No dependency, external model, network call, database change, commit, deployment or paid processing was added.

**Verification**

Sixteen focused recipe-text and Instagram importer tests passed, including source priority, missing-section fallback, OCR-last behaviour, comment isolation and the existing Instagram error contract. Focused ESLint and `git diff --check` passed. No external service was contacted.

**Consequences**

The next step can expose bounded optional evidence fields through the import API without inventing another merge rule. Comments will remain visibly unverified notes regardless of their contents.

**Reversal path**

Change the Instagram adapter back to `parseRecipeText`, remove `mergeRecipeEvidence` and its three focused tests. No stored data or migration is involved.

## 2026-09-27 — Validate optional recipe evidence at the import boundary

**Context**

The evidence merger can now combine captions, transcripts, image text and comment notes, but the import endpoint previously accepted only a link and optional pasted caption. Future interface fields must not be able to send unbounded or non-text evidence into retrieval, parsing or storage.

**Options considered**

1. Rely on future browser form limits.
2. Validate the new fields only in the HTTP route.
3. Let the route forward unknown values and validate them once in the shared import function before database or Instagram work.

**Decision**

Use option 3. The API accepts optional `transcript`, `imageText` and `commentText` fields. The shared import boundary requires strings, trims them and applies maximum lengths of 100,000 characters for captions, 100,000 for transcripts, 50,000 for image text and 1,500 for comments. Wrong types return `invalid_evidence` with HTTP 400; oversized supplemental evidence returns `evidence_too_large` with HTTP 413. The existing `caption_too_large` contract remains unchanged.

When no caption is supplied, public-caption retrieval still runs first. If Instagram blocks retrieval, a transcript or image text may continue through the deterministic merger; comments alone cannot create or complete a recipe. Comment text remains labelled unverified notes.

**Rationale**

The shared import function is the first boundary used by every caller, so one validation point protects the route, tests and future interfaces. Validating before duplicate lookup, retrieval or saving avoids unnecessary work with rejected input. The comment cap keeps the existing provenance text and comments within the recipe note field's 2,000-character storage boundary.

**Rejected alternatives**

Browser-only limits are bypassable. Route-only validation would leave direct callers with a weaker contract and duplicate validation logic. Adding a schema library for four optional strings would add a dependency without improving this small boundary.

**Trade-offs**

Limits use JavaScript character counts rather than encoded byte counts, which is sufficient for bounded text already held in the JSON request. Long transcripts or OCR dumps must be shortened before submission. The API capability is intentionally not visible in the interface until the dedicated form steps add reviewable inputs.

**Implementation effect**

The Instagram import route forwards three new optional fields. `importInstagramRecipe` validates them, keeps caption retrieval first and uses supplied transcript or image text only when needed. No UI, dependency, database schema, external model, paid call, secret, commit, deployment or live-site behaviour changed.

**Verification**

Eighteen focused recipe-text and Instagram importer tests passed. They cover successful transcript/image/comment import after blocked caption retrieval, wrong-type rejection, all three supplemental length limits, evidence priority, comment isolation and the previous importer paths. Focused ESLint and `git diff --check` passed. No external service was contacted.

**Consequences**

The next step can add a manual narration transcript box without changing the server contract. Later OCR and comment inputs can reuse the same bounded fields.

**Reversal path**

Remove the three request fields, evidence validation helper and supplemental import arguments, then restore caption-only retrieval. No stored data or migration is involved.

## 2026-09-27 — Offer manual narration without automatic transcription

**Context**

The import API can accept a bounded transcript, but the recipe drawer had no way to supply one. Narration needed an immediately usable zero-credit path without making the compact Instagram import card confusing or implying that Kitchen Katha listens to the Reel.

**Options considered**

1. Show a large transcript box permanently.
2. Add a separate narration page or dialog.
3. Add one native collapsible transcript section to the existing import form and send its text through the bounded API.

**Decision**

Use option 3. The recipe drawer now includes **Recipe is in the Reel narration?**, which reveals a labelled transcript textarea capped at 100,000 characters. Its copy explains that the owner must paste the spoken words, that recognisable Ingredients and Method headings help, and that the action neither transcribes video nor uses API credits. The public caption remains the first source. After Instagram blocks caption retrieval, the form accepts either a pasted caption or a narration transcript.

**Rationale**

Native `details`, `summary` and `textarea` elements provide keyboard and mobile behaviour without new state, components or dependencies. Reusing the existing form, API and editable-draft path keeps narration consistent with caption imports and makes the zero-credit fallback available before any automatic transcription work.

**Rejected alternatives**

A permanently expanded field would crowd the main link flow for recipes whose public caption already works. A new route or dialog would duplicate submission and error handling. Labelling this as transcription would misrepresent a manual paste workflow and blur the later paid-processing boundary.

**Trade-offs**

The owner must obtain and paste a transcript, and free-form narration without recognisable recipe sections may still open an incomplete draft for review. The optional field is collapsed by default to preserve the existing compact form.

**Implementation effect**

The existing client submits `transcript` beside the link and optional caption. One native collapsible section and a small amount of matching CSS were added. The caption fallback no longer requires caption specifically when a transcript is available. README guidance now distinguishes manual transcript input from automatic transcription. No external model, media download, dependency, database change, paid call, commit, deployment or live-site change was added.

**Verification**

Nineteen focused recipe-text and Instagram importer tests passed, including a runnable check for the bounded transcript field, request wiring, fallback validation and no-credit copy. Focused ESLint and `git diff --check` passed. No external service was contacted; the full build and mobile browser checkpoint remain Step 6.

**Consequences**

Narration text can now be used locally as soon as the owner pastes it. Automatic transcription remains disabled and visibly separate. The next step can add equivalent manual image-text and comment-note fields.

**Reversal path**

Remove the transcript section, its styles and request property, then restore the caption-only fallback requirement and README wording. The server may retain its unused optional transcript field without affecting current imports, or that field can be removed with Step 3.

## 2026-09-27 — Keep image text useful and comments untrusted

**Context**

The import API already accepts bounded image text and comment text, but the recipe drawer did not expose those inputs. The owner needs a zero-credit way to use recipe words shown inside Reel images and useful discussion tips without presenting manual paste as automatic OCR or allowing comments to become cooking instructions.

**Options considered**

1. Add automatic image inspection and comment collection now.
2. Put all pasted text into one undifferentiated recipe box.
3. Add separate manual image-text and useful-comment fields to the existing evidence section, preserving the server's evidence priority and comment trust boundary.

**Decision**

Use option 3. A second native collapsible section contains an editable **Text found in images** field capped at 50,000 characters and an editable **Useful comments** field capped at 1,500 characters. The client sends them as the API's existing `imageText` and `commentText` properties. Public caption, narration transcript and image text remain recipe evidence in that priority order. Comments are appended only under **Comments (unverified)** in notes and are never parsed as ingredients or method steps. After blocked caption retrieval, caption, narration or image text can provide the recipe; comments alone cannot.

**Rationale**

The existing form, API validation, evidence merger and editable incomplete-draft path already provide the required behaviour. Native `details`, labels and textareas keep the interface keyboard- and mobile-friendly without new state, components or dependencies. Separate fields make the different trust levels visible before submission and keep the security rule in the shared merger.

**Rejected alternatives**

Automatic OCR and comment retrieval would add media access, credentials, cost and privacy work reserved for a later checkpoint. One mixed text box would lose source priority and could let an unverified comment influence the recipe. A separate route or dialog would duplicate the current import flow.

**Trade-offs**

The owner must copy visible image text and select useful comments manually. Formatting still works best with recognisable Ingredients and Method headings. Comments remain reference notes even when they contain a valid correction; the owner can move a trusted correction into the editable recipe after review.

**Implementation effect**

The recipe drawer now submits two additional textareas through the already-bounded endpoint. Existing styles are reused for both evidence panels, with a shorter comment field. Interface copy states that no image inspection, OCR credits or automatic comment collection occurs. README guidance and the fallback prompt now include image text. No parser, API, dependency, database, external service, paid call, commit, deployment or live-site behaviour changed.

**Verification**

Twenty focused recipe-text and Instagram importer tests passed, including runnable checks for both field limits, request wiring, zero-credit image copy and the unverified-comment warning. Focused ESLint and `git diff --check` passed. No external service was contacted; the full build and mobile browser checkpoint remain Step 6.

**Consequences**

All four planned manual/public text sources can now reach the local importer with explicit priority and trust rules. Step 6 can verify the combined flow, production build and mobile layout before commit, push and deployment.

**Reversal path**

Remove the second evidence section, its two request properties and README wording. The server can retain the unused optional fields, or Step 3 can be reverted separately because no stored schema or migration depends on this interface.

## 2026-09-27 — Release the zero-credit multimodal text workflow as one verified change

**Context**

Steps 0–5 established the trust, parsing, validation and interface boundaries for public captions plus owner-pasted narration, image text and comments. Those changes remained local while each boundary was checked independently. The release checkpoint now needs to prove the combined source, responsive interface and production bundle before one commit and deployment.

**Options considered**

1. Publish each intermediate step separately without a combined check.
2. Delay release until automatic transcription, OCR and comment collection are added.
3. Run the complete project checks and desktop/mobile interface verification, then publish the existing manual workflow as one release.

**Decision**

Use option 3. Release the deterministic, zero-credit workflow now. Public-caption retrieval remains automatic; narration, image text and comments remain explicit owner-pasted inputs. Automatic media processing, private/login-gated access and comment collection stay outside this release.

**Rationale**

The manual workflow already solves the immediate blocked-caption and Reel-text cases without credentials, media downloads, paid processing or new dependencies. A single combined checkpoint catches integration and responsive-layout failures while preserving the evidence-priority and untrusted-comment rules already tested at their shared boundaries.

**Rejected alternatives**

Intermediate deployments would expose partially connected states and repeat build work. Holding the useful manual path for automatic extraction would add cost and privacy scope before real use demonstrates that it is needed.

**Trade-offs**

The owner still copies narration, visible image text and selected comments. Automatic media extraction may be more convenient later, but it will require a separate consent, cost, privacy and failure-handling design. This release favours transparent inputs and predictable formatting.

**Implementation effect**

The release consists only of the source-neutral parser, evidence merger, bounded API fields, manual evidence controls, focused tests and matching documentation from Steps 0–5. No dependency, database schema, secret, automatic transcription, OCR or comment collection was added.

**Verification**

The production build completed successfully. All 24 project tests and whole-project ESLint passed, and `git diff --check` reported no whitespace errors. Browser verification at 1280 × 900 and 390 × 844 confirmed both native evidence sections are keyboard-operable, all three manual fields are editable with their expected limits, and the expanded importer has no horizontal overflow. The local `/recipes` route returned HTTP 200.

**Consequences**

The verified source can be committed once, pushed to the public GitHub repository and published to the existing owner-private Kitchen Katha Site. Later automatic extraction remains a separate opt-in step rather than an implied capability of this release.

**Reversal path**

Revert this release commit and redeploy the prior saved Site version. The database schema is unchanged, so existing recipe records require no migration or data rewrite.

## 2026-09-27 — Select Groq for the first bounded narration trial

**Context**

Automatic Reel-narration transcription is the next optional capability after the released manual evidence workflow. Before writing an integration, Step 7 must refresh current provider pricing, upload limits, lifecycle status and data handling, then choose the cheapest route that fits Kitchen Katha's existing edge runtime and explicit-credit boundary. This is a research checkpoint only: no provider account, secret, endpoint, media upload or paid call is authorised.

**Options considered**

1. Use Cloudflare Workers AI `@cf/openai/whisper-large-v3-turbo`, currently listed at $0.0005 per audio minute with a 10,000-neuron daily free allocation.
2. Use Groq `whisper-large-v3-turbo`, currently listed at $0.04 per audio hour, or about $0.000667 per minute.
3. Use OpenAI `gpt-transcribe`, currently listed at $0.0045 per audio minute, or the cheaper but deprecated `gpt-4o-mini-transcribe` at $0.003 per minute.

**Decision**

Select Groq `whisper-large-v3-turbo` as the provisional provider for Steps 8–10. At current list price, one maximum five-minute trial is about $0.0033. Its OpenAI-compatible multipart endpoint accepts direct multilingual audio or video uploads, and its 25 MB free-tier upload limit covers the existing 20 MB application cap.

Keep the existing limits: one owner-supplied file, at most 20 MB and five minutes, one transcription request, no automatic retry, no automatic save, and transcript review before the deterministic parser runs. Step 8 will implement only a mocked server boundary that is disabled without a server-side `GROQ_API_KEY`. No real media may be sent until Zero Data Retention is enabled for the Groq organisation and the separately authorised paid-test step sets an explicit spend cap.

**Rationale**

Groq is the cheapest currently verified route that can be called directly over ordinary HTTPS from the existing server runtime without a new application dependency or a provider-specific platform binding. Its documentation identifies the turbo model as the best price/performance multilingual option, which matters for Indian cooking narration that may mix English with Indian languages. The planned five-minute file consumes only 300 audio seconds, comfortably within the documented free-tier rate limits of 7,200 audio seconds per hour and 28,800 per day; free-tier availability is a limit, not a promise that future use will remain free.

Cloudflare's model is nominally cheaper at about $0.0025 for five minutes and the current free allocation would cover a small trial. However, Workers AI requires an AI binding or separately authenticated Cloudflare account API access, while Kitchen Katha's managed Sites configuration currently declares D1 only and no AI binding. Introducing an unverified platform binding for a saving of less than one tenth of a cent per maximum trial is not the simplest dependable first integration.

**Rejected alternatives**

Cloudflare Workers AI is deferred until the managed Sites workflow exposes a verified AI binding or the owner chooses to configure a separate Cloudflare account. OpenAI `gpt-transcribe` remains the fallback because its 25 MB limit and data controls fit the boundary, but a five-minute file costs about $0.0225. OpenAI `gpt-4o-mini-transcribe` is not suitable for a new integration because OpenAI deprecated it on 2026-08-26 and lists removal on 2027-02-26. An always-on transcription path is rejected because the existing caption and manual transcript paths cost nothing and often already provide the recipe.

**Trade-offs**

Groq reports a 12% word error rate for the turbo model versus 10.3% for `whisper-large-v3`; those aggregate figures do not establish accuracy for Kitchen Katha's real accents, background music or code-switching. The editable transcript checkpoint is therefore required. If the separately authorised trial is materially inaccurate, test Groq `whisper-large-v3` at its current $0.111 per hour before changing provider.

Groq does not retain inference inputs or outputs by default, but it may temporarily log them for reliability or abuse investigations for up to 30 days unless Zero Data Retention is enabled. Any retained customer data is stored in US Google Cloud buckets. This is acceptable only with ZDR enabled before private cooking media is sent. Provider terms, model availability and prices can change and must be rechecked immediately before the first real call.

**Implementation effect**

None in Step 7. The application, schema, dependencies, secrets, interface, live deployment and current zero-credit import behaviour are unchanged. The next implementation step may target Groq's OpenAI-compatible transcription endpoint using native `fetch` and `FormData`, but must return mocked responses and remain disabled without a server secret.

**Verification**

Official provider documentation was checked on 2026-09-27: [Groq speech to text](https://console.groq.com/docs/speech-to-text), [rate limits](https://console.groq.com/docs/rate-limits) and [data controls](https://console.groq.com/docs/your-data); [OpenAI pricing](https://developers.openai.com/api/docs/pricing?tab=suite), [file transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [data controls](https://developers.openai.com/api/docs/guides/your-data) and [deprecations](https://developers.openai.com/api/docs/deprecations); and Cloudflare [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/) and [binding requirements](https://developers.cloudflare.com/workers-ai/configuration/bindings/). The local `package.json` and `.openai/hosting.json` confirm an edge-hosted Vinext application with no AI binding or transcription SDK. No API request, media upload, provider signup or credit use occurred.

**Consequences**

Step 8 has a concrete provider contract and can stay small: native multipart forwarding, a single model identifier, strict local validation and mock-only verification. Step 10 must first confirm ZDR, current price, model availability and hosting upload behaviour, then use one deliberately short test under the user-approved cap. A successful transcript must still be shown for editing before recipe parsing or saving.

**Reversal path**

Replace this provider decision before Step 8, or change the mock adapter before any real-call checkpoint. Because Step 7 adds no runtime code, account, secret, stored media or migration, reversal is documentation-only.

## 2026-10-04 — Add the disabled, mock-verified Groq transcription boundary

**Context**

Step 8 needs a testable server-side contract for future narration transcription without exposing a paid endpoint, uploading real media or weakening the later public-launch security work. The selected trial boundary is one owner-supplied audio or video file, at most 20 MB and five minutes, one provider request, transcript review and no automatic recipe save.

**Options considered**

1. Add a public upload route and connect it to the recipe interface now.
2. Add the Groq SDK and a complete transcription workflow.
3. Add one dependency-free provider adapter, keep it unreachable from the application, and verify it only with mocked responses.

**Decision**

Use option 3. `db/groq-transcription.mjs` validates the server secret, MIME family, byte size and caller-supplied duration before work; sends one native `FormData` request to Groq's OpenAI-compatible transcription endpoint using `whisper-large-v3-turbo`; bounds the response to 1 MB; and returns only a non-empty transcript of at most 100,000 characters. Provider failures use a small stable error contract and do not expose provider bodies. No route, client control, automatic retry, parser call or recipe save is added.

**Rationale**

The adapter is the smallest implementation that proves the provider contract while preserving the explicit-credit and transcript-review gates. Native `fetch`, `FormData`, `Blob` and `AbortSignal.timeout` already cover the job, so a provider dependency is unnecessary. Keeping the adapter unreachable also prevents the currently unauthenticated application API surface from becoming a paid-compute abuse path.

**Rejected alternatives**

A public route is rejected until owner authorization, request-size enforcement and rate limiting are implemented. A full interface would imply that automatic transcription is usable before privacy, hosting upload and real-provider checks pass. An SDK adds maintenance without improving this single request.

**Trade-offs**

The boundary is not user-accessible and its five-minute check currently trusts duration metadata supplied by a future authenticated server route. That future route must verify media duration rather than trusting a browser value. Provider compatibility is mock-verified only; it is not evidence that current production hosting accepts the upload or that Groq will accept a real file.

**Implementation effect**

One server-side module and one focused Node test file were added. The README now distinguishes the experimental adapter from the working manual-transcript flow. No dependency, schema, secret, route, interface, external request, commit, push or deployment was added.

**Verification**

`node --test tests/groq-transcription.test.mjs` passed all three tests, covering the missing-secret gate, invalid type, excessive duration, excessive file size, one mocked multipart request, fixed model and transcript return. The complete Node suite and production build were then run, and `git diff --check` passed. No provider call or API credit was used.

**Consequences**

Step 8 is complete as an inert provider boundary. Before any UI or route is added, Kitchen Katha still needs the recorded owner-only authorization, bounded request-body handling and abuse controls. The later real-call checkpoint must recheck provider terms, confirm Zero Data Retention and hosting upload behaviour, verify duration server-side, and use a separately approved spend cap.

**Reversal path**

Delete `db/groq-transcription.mjs` and `tests/groq-transcription.test.mjs`, then remove the matching README paragraph and this decision. There is no provider data, secret, schema or deployed endpoint to clean up.

## 2026-10-04 — Wire explicit-consent narration upload without enabling paid calls

**Context**

Step 8 established a mock-verified Groq adapter but left it unreachable. Step 9 needs to connect that boundary to the existing editable narration transcript while preserving the rule that no upload or charge happens from merely pasting an Instagram link. The security review also found that application routes lack owner authorization, so a paid route must not become active by default.

**Options considered**

1. Automatically transcribe every Reel during Instagram import.
2. Expose an enabled upload route controlled only by the presence of a Groq key.
3. Add an explicit owner-upload and credit-consent control, a body-bounded server route requiring both a feature flag and secret, and return the transcript for review without parsing or saving.

**Decision**

Use option 3. The narration section accepts one audio or video file, checks its MIME family, 20 MB size and five-minute browser-readable duration, and requires a separate acknowledgement that Groq processing may use API credits. Only the **Transcribe narration** button submits the file. The route rejects disabled configuration before reading the body, requires a finite multipart `content-length` below the capped allowance, rechecks consent, and calls the Step 8 adapter only when both `NARRATION_TRANSCRIPTION_ENABLED=true` and `GROQ_API_KEY` exist server-side. A successful response fills the existing editable transcript field and announces that review is required; it does not parse or save a recipe.

**Rationale**

This reuses the existing transcript field and native browser media metadata instead of adding a second editor, upload library or state model. The feature flag prevents an accidentally configured secret from activating a paid endpoint. Keeping transcription separate from the Instagram submit action makes credit use deliberate and leaves the zero-credit manual path unchanged.

**Rejected alternatives**

Automatic transcription would spend credits on captions the deterministic importer can already read. A secret-only gate could become publicly abusable as soon as a key is configured. Directly converting the returned text into a recipe would remove the required human review checkpoint.

**Trade-offs**

The route still has no application-level owner identity or rate limiter. It therefore remains disabled and must not be enabled or deployed for public access until the recorded owner-authorization and abuse-control work is complete. Browser-reported duration is useful early feedback but is not a trustworthy server measurement; a real-call release must verify media duration server-side. Requiring `content-length` may reject unusual chunked clients, which is acceptable for this single browser workflow because it prevents unbounded multipart buffering.

**Implementation effect**

One API route, a small addition to the existing narration section, matching styles and one focused static wiring check were added. No dependency, database change, secret, enabled feature flag, real provider call, recipe save, commit, push or deployment was added.

**Verification**

The focused transcription suite passed four tests, including the Step 8 provider contract and the Step 9 upload, consent, disabled-feature, body-length and review wiring. The Vinext production build included `/api/transcribe-narration`. The complete test command then passed, and `git diff --check` reported no whitespace errors. No media left the machine and no API credit was used.

**Consequences**

Step 9 is complete in source but deliberately unusable against Groq. Step 10 remains the separately authorised paid-test checkpoint and must not proceed until current provider terms and pricing, Groq Zero Data Retention, hosting upload behaviour, server-side duration verification, owner authorization, rate limiting and an explicit spend cap are confirmed.

**Reversal path**

Delete `app/api/transcribe-narration/route.ts`, remove the upload/consent block and its styles, restore the Step 8 README wording, and remove the Step 9 wiring assertions. The manual transcript path and inert Step 8 adapter will continue to work unchanged.

## 2026-09-30 — Keep Kitchen Katha private until public-reading and owner-management boundaries are separated

**Context**

Kitchen Katha is now intended to be publicly discoverable through Google, while the current application and README still describe one private owner collection. A whole-repository review assessed the interface, architecture, API routes, D1 model, security, accessibility, SEO, dependencies, tests and operating model without changing application source.

**Options considered**

1. Remove the current hosting login gate and expose the existing application unchanged.
2. Keep the complete application owner-private indefinitely.
3. Add a public read-only catalogue for explicitly published recipes beside an authenticated owner-only management workspace.
4. Build a full multi-user platform with accounts, tenant ownership and user publishing.

**Decision**

Use option 3 as the target architecture, but keep the current hosting login gate until it is implemented and verified. Public visitors will be readers only; recipe creation, editing, deletion and Instagram importing will remain owner-only. Existing recipes must default to private, and public recipe queries must use an explicit field allowlist.

Do not build option 4 unless visitors later need their own private drawers or publishing rights. Do not remove the current gate under option 1: the application routes have no identity or ownership check, and the single recipe table has no publication boundary.

**Rationale**

The current private design is coherent only while the external hosting gate is present. The CRUD API directly lists, creates, updates and deletes the shared D1 collection, and the importer performs parsing and outbound work without an application identity or rate boundary. A public read-only catalogue plus one owner workspace satisfies search discovery with much less schema, privacy, support and operational work than a multi-user service.

Google also needs anonymously accessible, stable recipe URLs. The current login page, drawer-only detail dialog, and lack of per-recipe routes, Recipe JSON-LD, sitemap, canonical URLs and robots policy cannot provide that surface.

**Rejected alternatives**

Exposing the existing site unchanged would make private journal fields and destructive routes reachable to anonymous callers. Keeping everything private is safe as a holding state but does not meet the public-search goal. A full multi-user platform adds account recovery, tenant-isolation, deletion/export, moderation and abuse obligations before the product needs them.

**Trade-offs**

The chosen split requires an additive D1 migration, owner authentication, a central server-side authorization guard, public/private data-access paths, body and rate limits, stable slugs, SEO pages, privacy decisions, backup/restore checks and expanded integration/accessibility coverage. In return, it keeps the product one-owner, preserves the current cooking workflow, defaults existing data to private and remains reversible by restoring the full hosting gate.

**Implementation effect**

None in this review. Application source, schema, secrets, hosting visibility and deployed behaviour are unchanged. The review produced a sealed security report, a separate hardening portfolio and a Graphify architecture map. The current owner-private deployment remains the release boundary.

**Verification**

The production build completed successfully and all 24 Node tests passed. The anonymous hosted root displayed “Log in to access,” confirming that the current URL is not crawlable. The standard security scan reviewed all 44 tracked files and recorded one high-severity missing-authorization finding plus one medium-severity importer resource-abuse finding. `npm audit --omit=dev` reported no production-classified advisory, while the complete dependency tree reported 23 advisories, including 16 high-severity entries and direct framework/build packages that need an upgrade and reachability review. The current whole-project ESLint command and a single-file ESLint attempt did not finish after several minutes and were interrupted, so lint is not a passing gate for this review. Graphify produced a 259-node, 407-edge map across 16 communities; its diagnostic reported five dangling edges and seven collapsed endpoint pairs, so the graph is useful but not complete.

**Consequences**

Kitchen Katha is suitable for continued owner-private use and demonstration, but is not approved for an anonymous real-world launch. Public hosting work must begin with the public/private contract and authorization boundary, not with SEO metadata alone. The current login gate stays in place until anonymous read, authenticated write, privacy, migration, dependency, accessibility, SEO and operational gates pass.

**Reversal path**

Supersede this decision after the selected public-catalogue architecture is implemented and the two security findings are revalidated. If the public rollout exposes private data or write authority, restore the full hosting gate and unpublish all recipes; the proposed publication fields should remain additive so private data does not need to be rewritten.

## 2026-10-06 — Complete Step 10 with a protected free Cloudflare transcription worker

**Context**

The Groq boundary from Steps 8–9 was mock-only and needed a provider key, data-control setup and a paid-test checkpoint. The owner asked for an alternate free option and authorised Codex to complete the external setup after signing in to Cloudflare.

**Options**

1. Keep the disabled Groq adapter and require manual account configuration.
2. Install and operate a local Whisper runtime and model.
3. Use the existing Cloudflare account's free Workers AI allocation through a small dedicated Worker.

**Decision**

Use option 3. A dedicated `kitchen-katha-transcription` Worker owns the `AI` binding and calls `@cf/openai/whisper-large-v3-turbo`. It accepts only authenticated POST requests, validates a single audio/video file up to 20 MB and five minutes, and returns only the transcript. Kitchen Katha forwards uploads through its existing owner-only server route using a shared secret stored as a Sites secret. The transcript remains editable and no recipe is parsed or saved automatically.

**Rationale**

This reuses Cloudflare's native binding, the existing Sites server route, browser `FormData` and native `fetch`; it adds no package or application-side AI SDK. The Worker endpoint is not usable without the shared secret, while the app upload route remains behind the current owner-only Site gate and keeps the existing explicit consent, size, duration and single-request boundaries.

**Rejected alternatives**

Groq remains a viable paid fallback but adds separate provider setup and data-retention decisions. Local Whisper avoids external media transfer but requires shipping or operating a large model/runtime that is not installed and does not fit the current hosted architecture.

**Trade-offs**

Cloudflare processes the selected media, the free daily allocation and model availability can change, and transcription can mishear accented speech, background music or Indian ingredient names. The editable review step is therefore mandatory. The shared-secret Worker is deliberately single-owner infrastructure; add per-user authorization and durable rate limiting before making the app public.

**Implementation effect**

The Groq adapter was replaced by `db/cloudflare-transcription.mjs`; the route now reads `CLOUDFLARE_TRANSCRIPTION_URL` and secret configuration; and the UI names Cloudflare Workers AI and its free daily allocation. Cloudflare Worker version `a9c8c28c` was saved with the AI binding and protected secret. Sites runtime environment revision 1 enables the feature for the owner-only project.

**Verification**

The focused four-test transcription suite passed. A 14.7-second macOS-generated cooking narration was sent to the protected Worker and returned a coherent transcript in one request, proving the real AI binding and authentication path. The complete application build, tests and production deployment are recorded in the task handoff after they run.

**Consequences**

Step 10 is no longer blocked on the owner manually creating a provider key. Kitchen Katha can offer real narration transcription without a paid API account while it remains owner-private; free allocation exhaustion must surface as a safe failure and never save a partial recipe.

**Reversal path**

Set `NARRATION_TRANSCRIPTION_ENABLED=false`, remove the three Sites runtime values, and delete the separate Worker after confirming no deployment uses it. The manual narration transcript path continues to work without any provider.

## 2026-10-06 — Complete Step 11 by verifying the enabled private mobile flow

**Context**

Step 11 called for enabling narration in the private deployment and verifying it from a phone. The alternate free-provider work in Step 10 had already enabled and deployed the feature, so another deployment would not change behaviour.

**Options**

1. Redeploy the unchanged source and environment configuration.
2. Change application code solely to create a new release marker.
3. Verify the existing live version, its environment gate and its phone-sized owner workflow without spending another transcription allocation.

**Decision**

Use option 3. Keep owner-private Sites version 12 and environment revision 1 unchanged. Verify the production recipe drawer while signed in as the owner at a 390 × 844 viewport, expand the narration workflow and confirm the file picker, explicit Cloudflare consent, transcription action, file limits and review-before-save copy are reachable.

**Rationale**

Step 10 already proved the protected Worker with a real synthetic-media request and deployed the enabled configuration. Repeating that work would consume allowance without testing a different contract. The remaining Step 11 risk was whether the enabled controls were usable in the live mobile layout.

**Rejected alternatives**

An unchanged redeployment adds operational risk but no evidence. A second real transcription would re-test the provider path rather than the mobile interface and would spend part of the free daily allocation unnecessarily.

**Trade-offs**

The verification used a browser at a phone viewport rather than physical iOS or Android hardware. It proves the responsive production layout and authenticated control path, but not device-specific file-picker behaviour, microphone capture or mobile-network performance.

**Implementation effect**

No application code, dependency, schema, Worker, secret, environment value or deployed version changed. Documentation now records the completed mobile checkpoint.

**Verification**

The Sites configuration reported `NARRATION_TRANSCRIPTION_ENABLED=true`, the Cloudflare Worker URL and a stored secret at environment revision 1. The live Site reported owner-only custom access and version 12. In the authenticated production recipe drawer at 390 × 844, the narration section expanded and exposed the upload, consent, transcription and review controls with the intended 20 MB and five-minute limits.

**Consequences**

Automatic narration transcription is complete for owner-private use. Step 12 may begin the separate local Reel-frame thumbnail workflow. Public access remains blocked by the existing authorization, rate-limit and server-side duration-verification launch gates.

**Reversal path**

No runtime reversal is needed because this step changed documentation only. Disable narration using the Step 10 reversal path if the private feature must be withdrawn.

## 2026-10-06 — Create Reel-frame thumbnails locally for Step 12

**Context**

The next image-text phase needs a cheap way to inspect an owner-supplied Reel before any frame selection or OCR exists. The step must not upload media or consume AI credits.

**Options**

1. Add a video-processing dependency or server endpoint.
2. Extract frames with the browser's native video and canvas APIs.
3. Wait and combine thumbnail extraction with selectable frames and OCR.

**Decision**

Use option 2. The image-evidence section accepts one local video up to 20 MB and five minutes, samples six evenly spaced moments away from the beginning and end, and renders compressed JPEG previews in a responsive grid. Object URLs are revoked after processing. The file input has no import payload role, and no network request is made.

**Rationale**

The browser already decodes the formats it can play and canvas can create small previews without a package, server, persistence or media-transfer boundary. Keeping Step 12 display-only makes the next frame-selection decision independently testable.

**Rejected alternatives**

FFmpeg or another dependency is unnecessary for the supported browser-local workflow. Server extraction would upload private media earlier than required. Combining selection and OCR would exceed this checkpoint and make credit behaviour harder to audit.

**Trade-offs**

Supported formats depend on the user's browser, seeking can take time on large or poorly indexed videos, and six evenly spaced frames can miss brief text. Step 13 can add bounded selection and screenshots without changing this local extraction boundary.

**Implementation effect**

`db/video-frames.mjs` defines the deterministic sample times. `app/recipe-journal.tsx` performs local video decoding and canvas capture, while `app/globals.css` presents the previews. No dependency, API route, database field, secret or hosted environment value was added.

**Verification**

The focused 19-test set passed, including even frame sampling and source checks for native video/canvas use with no frame-upload request. The Vinext production build passed. `git diff --check` passed before documentation was updated and is rerun at handoff.

**Consequences**

Step 12 is complete locally. Step 13 may make at most four frames selectable and accept up to four screenshots or images. No source change is published or deployed at this non-checkpoint step.

**Reversal path**

Remove the local video input, thumbnail state/handler, preview styles, helper and focused test. Narration transcription and manual image-text entry continue unchanged.

## 2026-10-06 — Bound local frame and screenshot selection for Step 13

**Context**

Step 12 created six local Reel-frame previews but offered no way to choose useful frames. The planned OCR boundary needs a small, explicit image set and must retain the zero-credit manual-text path.

**Options**

1. Select every generated frame automatically.
2. Give generated frames and uploaded screenshots separate four-image allowances.
3. Enforce one shared limit of four selected frames or uploaded screenshots and keep all previews local.

**Decision**

Use option 3. Generated frame cards are accessible toggle buttons. Up to four screenshots or images, each no larger than 5 MB, can also be previewed. Selected frames and uploaded images share a single four-image ceiling, and the existing manual image-text box remains directly below the previews.

**Rationale**

One combined bound matches the later single-batch OCR design and prevents an apparently valid UI state from exceeding its future request limit. Native `FileReader` is already available, so screenshot previews require no storage, dependency or object-URL lifecycle.

**Rejected alternatives**

Automatic selection would spend later OCR capacity on irrelevant frames. Separate allowances could produce eight images for a four-image endpoint. Adding deletion, reordering or persistent media storage is unnecessary before OCR exists.

**Trade-offs**

Choosing a new screenshot set replaces the previous set, and uploaded images cannot yet be reordered individually. The four-image cap may require the owner to choose the clearest recipe text rather than preserve every visual.

**Implementation effect**

The existing frame helper now owns the bounded toggle rule. The recipe journal tracks selected frame times and local screenshot data URLs, presents selected state and a combined count, and clears transient previews after a successful import. No request payload, API route, database field, dependency or hosted environment value changed.

**Verification**

Sixteen focused tests passed, including combined-limit selection, deselection, native video/canvas wiring and the local multiple-image input. The Vinext production build and `git diff --check` passed before documentation was updated and are rerun at handoff.

**Consequences**

Step 13 is complete locally. Step 14 may add a disabled, mock-tested vision/OCR server boundary that accepts only this bounded image batch. No media currently leaves the browser.

**Reversal path**

Remove the screenshot picker, selected-frame state and toggle helper while retaining Step 12's display-only thumbnails and the manual image-text field.

## 2026-10-06 — Add a disabled, mocked OCR boundary for Step 14

**Context**

Steps 12–13 produce a bounded local set of up to four recipe images. Step 14 needs a server contract for later OCR without exposing a callable paid feature, choosing a provider prematurely or sending real media.

**Options**

1. Put provider-specific OCR logic directly in the recipe page.
2. Add a provider-neutral server adapter and disabled route, verified through injected mock responses.
3. Wait and combine the server contract with the credit-using interface.

**Decision**

Use option 2. `readRecipeImages` accepts one to four `image/*` files, limits each to 5 MB and the complete batch to 20 MB, sends them together in one authenticated multipart request, and accepts at most 50,000 characters from a response capped at 1 MB. `/api/read-images` rejects disabled configuration and oversized request bodies before multipart parsing, requires explicit credit consent, and is inert without three server environment values.

**Rationale**

This mirrors the already tested narration boundary using native `fetch`, `FormData`, `Blob`, `AbortSignal` and response streaming. Dependency injection proves the provider contract without a real endpoint, account, secret, upload or credit charge.

**Rejected alternatives**

Client-side credentials would expose secrets. A provider SDK adds a dependency before a provider is selected. Combining route and UI would make it easier to trigger an unintended call and exceed the agreed one-step scope.

**Trade-offs**

The contract assumes a future protected endpoint returns JSON with one `text` field. A selected provider may require a thin translation Worker, and image dimensions or decompression cost are not yet validated beyond MIME and byte limits. Those checks must be reconsidered before enabling a public endpoint.

**Implementation effect**

`db/image-ocr.mjs` owns validation, one-request multipart forwarding and response bounds. `app/api/read-images/route.ts` owns the disabled feature gate, body-size check and explicit-consent boundary. No client wiring, dependency, schema, secret, environment value or deployment was added.

**Verification**

Eleven focused tests passed. They prove disabled configuration performs no call, invalid count/type/size batches perform no call, two mock images travel in one protected request, and the route checks configuration, content length, consent and all image parts. The Vinext build included `/api/read-images` and completed successfully. `git diff --check` passed before documentation was updated and is rerun at handoff.

**Consequences**

Step 14 is complete as an inert boundary. Step 15 may add an explicit credit-warning control that converts the four local previews into files, calls this route once, and places returned text in the existing editable image-text field. The route must remain disabled until an approved provider endpoint and secret exist.

**Reversal path**

Delete the image OCR adapter, disabled route and focused tests. Steps 12–13 local previews and manual image-text entry remain unchanged.

## 2026-10-06 — Wire explicit OCR consent and editable review for Step 15

**Context**

Step 14 created a disabled, mock-tested OCR route but no user action could reach it. Step 15 needs an explicit credit-warning control and editable result while preserving the rule that selecting media alone never triggers a request.

**Options**

1. Read images automatically when selected.
2. Add a separate consent checkbox and button that sends one bounded batch, then fills the manual image-text field.
3. Merge OCR into the final Add to drawer submission.

**Decision**

Use option 2. The interface converts selected local previews back into browser `File` objects, requires a separate acknowledgement that an external image-reading service may use API credits, sends all selected images to `/api/read-images` in one request, and writes returned text into `instagramImageText`. The normal recipe import remains a separate action.

**Rationale**

An explicit button makes cost and media transfer visible at the moment they occur. Reusing the existing editable field keeps OCR output in the caption → transcript → image-text evidence order and prevents unreviewed text from becoming trusted recipe data.

**Rejected alternatives**

Selection-triggered OCR could spend credits accidentally. Folding OCR into Add to drawer would hide the external call and make retry behaviour ambiguous. A second OCR-specific editor would duplicate the existing manual field.

**Trade-offs**

The control is visible but returns the disabled-service message until protected provider configuration exists. Data-URL conversion temporarily duplicates selected images in browser memory, bounded by the existing four-image and byte limits.

**Implementation effect**

The local image helper converts safe preview data URLs into image files. The recipe journal adds one busy state, consent checkbox, credit-labelled button and one request handler. Successful OCR text remains editable and is never parsed or saved automatically. No dependency, schema, provider, secret, environment value or deployment was added.

**Verification**

Twenty-two focused tests passed, including data-URL conversion, consent and credit-warning wiring, one OCR request, editable-field assignment and the prior route/batch limits. The Vinext production build passed. No external endpoint was configured or called, and no AI credit was used. `git diff --check` passed before documentation was updated and is rerun at handoff.

**Consequences**

Step 15 is complete locally and remains safe by default. Step 16 is the separately authorised real-image test and must specify a maximum of four images and an explicit spending cap after current provider pricing, privacy and image handling are confirmed.

**Reversal path**

Remove the OCR consent/action UI, request handler and data-URL conversion helper. The disabled Step 14 route and zero-credit manual image-text workflow continue unchanged.

## 2026-10-06 — Validate Cloudflare vision OCR within the Step 16 £1 cap

**Context**

Step 15 left automatic image reading provider-disabled. Step 16 authorised one real image batch, no more than four images, with a maximum cash spend of £1. Current pricing, data use and the actual provider response needed evidence before any production configuration.

**Options**

1. Enable the live Site and test through the owner interface.
2. Use an isolated Cloudflare Worker for one synthetic image, then disable it.
3. Stop after mocked tests and estimate quality from documentation.

**Decision**

Use option 2 with one 1200 × 1200 synthetic Paneer Tikka image and `@cf/meta/llama-3.2-11b-vision-instruct`. Accept the required Meta model terms after explicit owner approval, send one OCR batch, compare every visible recipe line, inspect account usage, and replace the temporary handler with an HTTP 410 response. Do not configure or deploy the production Site.

**Rationale**

An isolated test measures the exact provider contract and Indian-recipe content while avoiding personal data, Instagram media and production risk. Cloudflare documents a daily free Workers AI allocation and says customer content is not used to train or improve its services without explicit consent.

**Rejected alternatives**

Testing in production would require a persistent secret and could expose an unfinished feature. Mock-only evidence cannot measure OCR accuracy. A larger or real Instagram batch was unnecessary for the first paid-provider checkpoint.

**Trade-offs**

One clean synthetic image proves basic printed-text extraction, not handwriting, motion blur, decorative fonts or four-image ordering. The account usage view can lag; at the recorded check it displayed `0/10k` neurons used today rather than a per-request image-model figure.

**Implementation effect**

No application code, environment variable, production Worker or Site deployment changed. The existing provider-neutral `{ text }` contract is compatible with a thin Cloudflare adapter. The isolated `kitchen-katha-ocr-test` Worker now returns HTTP 410 for every request; its AI binding remains attached but its active code cannot invoke it.

**Verification**

The sole OCR batch returned all 14 meaningful source lines exactly: title, headings, five ingredient quantities and four numbered method steps; it added Markdown emphasis and bullets only. Measured content accuracy was 100% on this fixture. The Cloudflare dashboard reported `0/10k` neurons used today, so observed cash spend was £0.00 against the £1 cap. A direct request after shutdown returned HTTP 410 with `{"error":"Step 16 test complete"}`. The focused tests, production build and whitespace check are rerun at handoff.

**Consequences**

Step 16 is complete as a provider checkpoint, not a production release. Cloudflare is a technically viable first OCR provider for clear screenshots. A later explicit step must create the protected adapter/secret, configure the three server variables, deploy, and validate poor-quality and multi-image cases before users can rely on it.

**Reversal path**

Delete the isolated Cloudflare test Worker and its binding after owner confirmation. No repository rollback is needed because Step 16 changed documentation only.

## 2026-10-07 — Make pasted comments selectively useful for Step 18

**Context**

The manual comments fallback accepted one text block, so an owner had to edit unwanted lines before importing. Step 18 requires each pasted comment to be visible separately and explicitly selected before it can enter recipe notes.

**Options**

1. Save every pasted line automatically.
2. Parse non-empty lines locally into a checkbox list and submit only selected lines.
3. Retrieve comments from Instagram automatically.

**Decision**

Use option 2. Split pasted text on line boundaries in the browser, display each non-empty line as an unchecked option, and send only checked lines through the existing bounded `commentText` field.

**Rationale**

The existing API and evidence merger already keep comments out of ingredients and method steps. A small local selector completes the review workflow without a Meta connection, new endpoint, dependency, or external request.

**Rejected alternatives**

Automatic selection weakens the review boundary. Automatic retrieval belongs to the separately gated professional-account phase and cannot cover arbitrary creators' posts.

**Trade-offs**

One pasted line is treated as one comment, so multi-line comments must be condensed before pasting. Changing the pasted text clears the current selection to prevent stale lines from being submitted.

**Implementation effect**

Add one line-splitting helper, two small client state values, an accessible checkbox fieldset, a hidden selected-comments form value and minimal styling. The server contract and 1,500-character limit remain unchanged.

**Verification**

All 39 tests and the Vinext production build passed. Focused ESLint completed with only the two existing native local-preview `<img>` warnings, and `git diff --check` passed. The local preview server could not be reached from the sandboxed browser namespace, so no interactive browser claim is made.

**Consequences**

Step 18 is complete locally and uses no runtime credits. Step 17 OCR deployment remains paused before secret creation, and Step 19 remains a separate research-only eligibility check.

**Reversal path**

Restore the single named comments textarea and remove the line helper, selection state, checkbox fieldset and styles. The existing server-side unverified-comments boundary remains valid.

## 2026-10-07 — Limit official Meta comment retrieval to eligible owned media for Step 19

**Context**

Step 19 requires checking whether automatic Instagram comment retrieval is officially available for Kitchen Katha before building a client or changing an account. The intended recipe workflow often starts from public Reels posted by other creators, while Meta's supported API is scoped to professional accounts managing their own presence.

**Options**

1. Treat every public Instagram URL as eligible for automatic comment retrieval.
2. Use Instagram API with Facebook Login and require a linked Facebook Page.
3. Prefer Instagram API with Instagram Login for a Business or Creator account, but enable comment retrieval only after the submitted URL is matched to media owned by that authenticated account.
4. Keep pasted comments as the only workflow.

**Decision**

Use option 3 only for eligible owned media and retain option 4 for all other recipes. Step 20 must not build a general-purpose comments importer. Its mocked client is eligible to proceed only after the owner confirms a Business or Creator profile and confirms that the target recipe posts are published by that same profile.

**Rationale**

Meta's current official Instagram Login documentation supports Business and Creator accounts, does not require a linked Facebook Page, and uses `instagram_business_basic` plus `instagram_business_manage_comments` for the required read boundary. Meta describes comment management as operating on the professional account's media; it does not offer unrestricted comment access for arbitrary public creators' posts.

**Rejected alternatives**

Public-page scraping is brittle and would evade the intended account and media ownership boundary. Facebook Login adds a linked Page and extra permissions without helping the chosen single-owner use case. Removing pasted comments would leave third-party recipes with no reliable comments workflow.

**Trade-offs**

Automatic comments will cover only recipes posted by the connected professional account, which is narrower than the main discovery workflow. The owner must maintain a Meta app and OAuth token if this optional path is later enabled. App review or elevated access may be necessary before users outside app roles can connect.

**Implementation effect**

Document a ten-item setup checklist and the exact eligibility gate. Prefer Instagram Login, request only `instagram_business_basic` and `instagram_business_manage_comments`, store tokens server-side, resolve only authenticated-account media, use bounded cursor pagination and present retrieved comments unchecked. No application code, Meta app, account setting, OAuth connection, token, API request or deployment changes in Step 19.

**Verification**

The requirements were checked on 2026-10-07 against Meta's current official Instagram API materials: Instagram Login is limited to professional accounts, does not require a linked Facebook Page, and exposes the current `instagram_business_*` scopes; Facebook Login requires a linked Page and cannot access consumer accounts. The repository and project records contain no verified account type or proof that target recipe media is owned by the account, so eligibility remains conditional rather than assumed.

**Consequences**

Step 19 is complete as a no-cost research and setup checkpoint. Step 20 is blocked for the general arbitrary-creator workflow and may proceed only as an owned-media client after the two owner confirmations. The Step 18 pasted-comments selector remains the production-safe general solution.

**Reversal path**

Remove the Step 19 README checklist and this decision entry. No runtime or account rollback is required because no external state changed.

## 2026-10-10 — Stop Step 20 because the account and media are ineligible

**Context**

The owner confirmed that their Instagram account is private and that Kitchen Katha will mostly import public recipe links from Business or Creator accounts owned by other people. Step 20 was explicitly conditional on the connected professional account owning the target media.

**Options**

1. Build the mocked Meta comments client despite the failed eligibility gate.
2. Ask the owner to convert or expose their private account even though doing so would not grant access to other creators' media.
3. Stop Step 20 and retain the zero-cost pasted-comments selector for third-party recipes.

**Decision**

Use option 3. Do not implement Step 20 for the current workflow.

**Rationale**

Meta's official Instagram API supports professional accounts managing their own media; the public status or professional type of a different creator's account does not transfer comment access to Kitchen Katha. Converting the owner's account would therefore add account and token complexity without solving the intended third-party recipe use case.

**Rejected alternatives**

Building a knowingly unusable client would create dead code and invite a false promise in the interface. Scraping public comments or reusing Instagram cookies would be brittle and violate the project's privacy and access-control boundary.

**Trade-offs**

Comments from third-party recipe posts must be pasted manually. The existing selector makes that review explicit and uses no Meta connection or runtime credits.

**Implementation effect**

No application code, dependency, account setting, permission, token, API request or deployment changes. Step 20 remains unimplemented by design.

**Verification**

The eligibility conclusion combines the owner's 2026-10-10 account and media-ownership confirmation with Meta's current official Instagram API documentation. `git diff --check` is the only relevant repository check because this decision changes documentation only.

**Consequences**

The Phase D Meta connection path stops at Step 19 for the current product. Steps 21 and 22 are also inapplicable unless the use case later changes to recipes posted by an owner-controlled Business or Creator account.

**Reversal path**

If an owner-controlled professional account later publishes the target recipes, re-run Step 19 against current Meta requirements and then reconsider Step 20 as an owned-media-only client.

## 2026-10-10 — Make permitted saved-media upload explicit for Step 23

**Context**

Kitchen Katha already has bounded local inputs for narration audio/video, saved Reel video frame extraction and screenshots. Step 23 requires a clearly labelled path for media the owner is allowed to use without adding Instagram authentication or private-post retrieval.

**Options**

1. Add a second upload system dedicated to saved media.
2. Reuse the existing inputs and place one clear permission boundary before them.
3. Download media directly from Instagram links.

**Decision**

Use option 2. Label the existing route **Upload media you are allowed to use**, state that files must be created by the user or processed with permission, and rename each file input to identify saved media explicitly.

**Rationale**

The existing controls already enforce the relevant file and duration limits and keep selection local until a separate transcription or image-reading consent action. Reusing them completes the user-facing requirement without duplicate state, storage or dependencies.

**Rejected alternatives**

A second uploader would duplicate working controls. Direct Instagram downloading would cross the privacy boundary established by the multimodal plan and would not make private or third-party media authorised.

**Trade-offs**

Kitchen Katha relies on the user to determine whether they have permission to process a saved file. It cannot independently verify copyright or consent.

**Implementation effect**

Add one visible permission notice, rename three existing labels, add minimal styling and one source-level regression check. File handling, limits, local previews, processing consent, APIs and storage remain unchanged.

**Verification**

On 2026-10-10 the focused Instagram importer test passed 14/14, the full Node suite passed 40/40, the Vinext production build passed, `git diff --check` passed, and focused ESLint reported zero errors with the two existing native local-preview `<img>` warnings.

**Consequences**

Step 23 provides an explicit permitted-media entry path without requesting credentials, downloading Instagram content, storing raw media or spending credits. Step 24 may reuse these same inputs for processing; it must not create another uploader.

**Reversal path**

Remove the permission notice and restore the three previous labels. No data or account rollback is required.

## 2026-10-10 — Reuse the existing processing routes for Step 24

**Context**

Step 24 requires permitted saved media to flow through the narration and selected-image workflows without requesting Instagram passwords or session cookies. The Step 23 inputs were intentionally labels over the upload controls built and bounded in earlier steps.

**Options**

1. Add another routing layer or duplicate upload controls for Step 24.
2. Reuse and verify the existing narration, frame-selection and image-reading paths.
3. Authenticate to Instagram or download media from a submitted post URL.

**Decision**

Use option 2. No application-code change is needed: the existing controls already implement the complete Step 24 routing contract.

**Rationale**

The narration file is validated locally, sent to `/api/transcribe-narration` only after explicit consent, and returned into the editable transcript field. A saved video is decoded locally into six frames; selected frames and saved screenshots share the four-image limit and are sent to `/api/read-images` only after separate consent. Returned image text enters the editable image-text field. Both fields then pass through the existing bounded recipe-evidence parser. Browser object URLs are revoked after media inspection, and no client path reads Instagram credentials or cookies.

**Rejected alternatives**

Duplicate routing would create two contracts for the same files. Instagram login, password handling, cookie reuse or automatic private-media downloading is outside the approved privacy boundary and would not establish permission to process third-party media.

**Trade-offs**

Narration and image reading remain separate deliberate actions, so a video containing both evidence types requires two user choices. This is preferable to silently making multiple processing calls and spending credits.

**Implementation effect**

No runtime code, dependency, API, data model or interface change. Step 24 is satisfied by the existing protected transcription route, local frame extractor, protected image-reading route and shared recipe-text parser.

**Verification**

On 2026-10-10 all 14 focused transcription, frame and image-reading tests passed, the full Node suite passed 40/40, the Vinext production build passed and `git diff --check` passed. Source inspection confirms that the client calls only Kitchen Katha's same-origin processing routes and contains no cookie or credential retrieval path.

**Consequences**

Step 24 is complete without new code or credits. Step 25 can now verify raw-media disposal and absence from D1 and logs without changing this routing design.

**Reversal path**

No runtime reversal is required. Remove this decision entry if the documented trace is later found incorrect and address the actual missing route at that time.

## 2026-10-10 — Discard raw media after processing for Step 25

**Context**

Step 25 requires proving that uploaded audio, video and images are discarded after processing and never stored in D1 or application logs. The server routes were already request-scoped, but browser file inputs and generated previews remained in memory until the complete import form was submitted or unmounted.

**Options**

1. Accept browser-lifetime retention because it is not durable storage.
2. Clear raw selections and previews immediately after their last successful use and add a static privacy regression check.
3. Add permanent media storage with later deletion jobs.

**Decision**

Use option 2. Clear the narration file and consent after a transcript is returned, clear original video and image input selections after local preview generation, clear derived frame/image previews and OCR consent after image text is returned, and continue revoking temporary object URLs.

**Rationale**

Immediate browser cleanup narrows the lifetime of sensitive media without affecting the editable text result. The D1 schema contains only structured recipe fields, and neither processing route imports recipe storage or logs request content. Permanent media storage is unnecessary for a text-extraction workflow.

**Rejected alternatives**

Keeping raw media for the full form lifetime is avoidable retention. R2 or D1 storage would add cost, deletion complexity and privacy risk while providing no requested product value.

**Trade-offs**

After successful processing, retrying with the same source requires selecting the file again. Failed processing keeps the selection so the owner can retry without unnecessary file picking.

**Implementation effect**

Add browser cleanup at the four existing success boundaries and one dependency-free privacy test covering cleanup, D1 schema exclusions, absence of storage imports/writes and absence of processing logs. Text transcripts, OCR results and final structured recipe data remain available for review and saving.

**Verification**

On 2026-10-10 all 16 focused privacy, transcription, frame and image-reading tests passed, the full Node suite passed 42/42, the Vinext production build passed, `git diff --check` passed, and focused ESLint reported zero errors with the two existing native local-preview `<img>` warnings. No real media or external provider call was used.

**Consequences**

Raw media now exists only while the browser or request needs it. Kitchen Katha does not persist raw media in D1 or emit it through application logging. Provider-side request handling remains governed by the configured Cloudflare service rather than D1.

**Reversal path**

Remove the four cleanup statements and the privacy regression test. No stored data migration is required because raw media was never added to the schema.

## 2026-10-10 — Step 26 release validation keeps the owner-private gate

**Context**

Step 26 requires security, privacy, duplicate, failure and mobile checks across every enabled evidence source without deploying or calling paid providers.

**Options**

1. Treat the passing functional suite as enough for release.
2. Validate the whole repository, responsive runtime and release gates, then keep the current owner-private deployment until reportable findings are fixed.
3. Make the Site anonymous now and rely on the hosting platform's general limits.

**Decision**

Use option 2. Step 26 is complete as a validation checkpoint, but Kitchen Katha is not approved for anonymous public access or Step 27 deployment.

**Rationale**

The 42-test suite and production build pass. Duplicate imports remain protected by the conditional insert and partial unique index. Raw media is cleared after successful processing, is absent from D1 and request logs, and provider routes keep explicit consent and multipart limits. At a 390 × 844 browser viewport, the recipe drawer, expanded narration/image controls and centrally pulled recipe card have no horizontal overflow; invalid Instagram text is rejected by native form validation.

The sealed Codex Security scan `1b8c657e-b78a-4e2a-94d8-8b01b2a50771` reviewed all 55 inventoried files and recorded one medium and two low findings: no application-level owner authorization on recipe/provider routes, JSON parsing before an application body-size guard, and raw internal recipe error messages. The external owner-private Sites gate lowers current exposure but is not enforced by this repository. A standalone `tsc --noEmit` check also fails because Cloudflare Worker ambient types are not configured outside the Vinext build, and the pulled-card overlay has no dialog role in the browser accessibility tree.

**Rejected alternatives**

A passing build does not prove authorization, bounded input or safe error behavior. Anonymous launch would turn the missing in-app owner boundary into a directly reachable data and provider-capacity risk.

**Trade-offs**

The owner can continue using the private Site, but public discovery remains deferred. The mobile check used a browser viewport rather than physical iOS or Android hardware, so file-picker and mobile-network behavior are still unverified.

**Implementation effect**

No runtime code, dependency, database, provider configuration or deployment changed in Step 26. The scan report is retained outside the repository at the Codex Security scan path. README release status now reflects the verified gates.

**Verification**

On 2026-10-10, `node --test tests/*.test.mjs` passed 42/42, `npm run build` passed, `npm run lint` completed with zero errors and the two existing local-preview `<img>` warnings, and `git diff --check` passed. `npx tsc --noEmit` failed only on unresolved `cloudflare:workers`, `Fetcher` and `D1Database` types. Local responsive inspection at 390 × 844 confirmed `scrollWidth === innerWidth` for the drawer, expanded media inputs and pulled recipe card. No paid provider request or production deployment was made.

**Consequences**

Before a public launch, add one shared server-side owner authorization boundary, rate-limit provider routes, reject oversized JSON before parsing, return generic unexpected errors, configure Cloudflare ambient types for the standalone check, add dialog semantics, and repeat Step 26. Step 27 remains blocked until that remediation is explicitly authorised and verified.

**Reversal path**

This is a release-gate decision rather than a runtime change. It is superseded only by a later decision that links verified fixes and a clean repeat scan; until then, retain the owner-private hosting gate.

## 2026-10-11 — Close the Step 26 release blockers with Sites-native owner identity

**Context**

The owner authorised the Step 26 blocker fixes and then Step 27. The validated blockers were missing application owner authorization and provider rate limits, unbounded JSON parsing, raw internal recipe errors, missing Cloudflare ambient types and incomplete recipe-dialog naming.

**Options**

1. Add a separate login/session product and external rate-limit service.
2. Enforce the existing Sites-authenticated user ID once at the top-level Worker, use the existing D1 binding for fixed-window limits, and fix the remaining boundaries locally.
3. Continue relying only on the external owner-private access policy.

**Decision**

Use option 2. The Worker now fails closed outside local development unless `oai-authenticated-user-id` matches the server-side `KITCHEN_KATHA_OWNER_ID`. This guard runs before server-rendered pages, API handlers, image optimization and provider work. Instagram imports allow 20 requests per minute; narration and image reading allow five each, counted atomically in D1. JSON routes use one streaming bounded reader, recipe validation has a typed safe error, unexpected failures return generic text, official Worker types cover the standalone check, and the native detail dialog has an explicit accessible name.

**Rationale**

Sites already supplies a stable, Site-specific authenticated user ID, so another authentication stack would duplicate the platform boundary. Enforcing the configured owner ID in the Worker also covers `/recipes` and `/planner`, which read D1 during server rendering and would bypass API-only middleware. D1 makes rate limits consistent across Worker isolates without another service or dependency.

**Rejected alternatives**

Basic authentication would introduce another password. An in-memory limiter is bypassable across isolates. API-only authorization would leave server-rendered reads exposed. `Content-Length` alone would miss chunked bodies, so the JSON reader counts streamed bytes.

**Trade-offs**

Every provider/import request adds two small D1 statements, including an idempotent table check. This is proportionate for one owner and three bounded routes. The one-owner ID must be configured before production deployment; missing configuration returns 503. Localhost remains available for development without injecting production identity headers.

**Implementation effect**

Add the shared request-security and bounded-JSON helpers, one D1 fixed-window counter table created on demand, typed recipe input errors, Worker owner enforcement, route-safe error mapping, Cloudflare Worker type configuration, dialog labelling and focused security tests. Sites environment revision 2 stores the owner ID as a secret; no value is committed.

**Verification**

On 2026-10-11, 50/50 Node tests passed, the Vinext production build passed, `npx tsc --noEmit` passed, `git diff --check` passed and ESLint completed with zero errors and the two existing local-preview `<img>` warnings. Tests prove owner allow/deny/fail-closed behavior, fixed-window rejection/reset, streamed oversized and malformed JSON rejection, safe validation classification, bounded route usage, Worker guard ordering and dialog naming. The separate patch-review worker exhausted the account allowance, so the parent independently checked alternate page/API paths, invalid recipe IDs, local development and provider failure behavior before final verification.

**Consequences**

The Step 26 source blockers are closed for the current one-owner private deployment. Step 27 may commit, push and deploy this exact verified state privately. A future anonymous catalogue or multi-user product still requires resource-level public/private authorization rather than reusing this owner-only check.

**Reversal path**

Restore the previous private deployment version and remove the owner-ID environment entry if production identity propagation fails. Reverting the Worker guard without restoring the full external access gate is not permitted.

## 2026-10-11 — Accept the Sites identity header production actually supplies

**Context**

The first Step 27 deployment proved that Sites passed the authenticated owner's verified email but not `oai-authenticated-user-id` to the Worker. The ID-only guard therefore returned 401 to the legitimate owner.

**Options**

1. Remove the application guard and rely only on the Sites access policy.
2. Allow any authenticated email because the current Sites policy has one member.
3. Keep the guard fail-closed and match either a configured owner ID or configured verified email.

**Decision**

Use option 3. `ownerAccessStatus` accepts the request only when a supplied Sites identity equals one of the two separately configured owner identities. Local development remains unchanged.

**Rationale**

Supporting the two native identity headers is smaller and safer than adding authentication. Binding the email to a secret environment value preserves the owner check even if the hosting audience is widened accidentally; merely checking for any email would not.

**Rejected alternatives**

Removing the Worker boundary would reopen the Step 26 authorization finding. Trusting any authenticated email would couple security to the external audience setting instead of enforcing the owner invariant in code.

**Trade-offs**

Production now has two equivalent identity secrets to maintain. Either can authorize the same owner, which tolerates current header propagation while retaining the account-ID path if Sites supplies it later.

**Implementation effect**

Add `KITCHEN_KATHA_OWNER_EMAIL` to the Worker environment contract and the shared owner guard. Use the configured available identity as the rate-limit key. Store the email only as a Sites secret; do not commit it.

**Verification**

Focused tests cover case-insensitive email acceptance, a different-email rejection, ID acceptance, missing-config fail-closed behavior and localhost development. The complete project checks and live owner request are repeated before this replacement release is accepted.

**Consequences**

The owner can use the private deployment with the identity header Sites currently sends. Public or multi-user access remains unsupported.

**Reversal path**

Restore the previous private version only while keeping the external one-owner Sites access gate. Remove the email secret after a verified release consistently supplies and accepts the stable account ID.

## 2026-10-12 — Move Instagram importing behind Add recipe

**Context**

The Instagram importer occupied a large permanent panel above the recipe drawer. The owner wants the drawer focused on saved cards while keeping Instagram import convenient from the Add recipe flow.

**Options**

1. Create a separate Instagram page and navigation item.
2. Duplicate the importer inside the existing recipe form.
3. Reuse the existing importer in its own dialog, opened from a clear option inside Add recipe.

**Decision**

Use option 3. The recipe drawer no longer displays the importer panel. On the recipes page, Add recipe presents an Import link choice that closes the manual form and opens the existing Instagram workflow in a labelled modal.

**Rationale**

This keeps the primary drawer quiet without introducing another route or duplicating importer state, validation and provider controls.

**Rejected alternatives**

A separate page adds navigation for one supporting action. Nesting or duplicating forms would create invalid markup or two implementations to maintain.

**Trade-offs**

Instagram import now takes one extra tap. The option is intentionally shown only in Add recipe on the recipes workspace, where the importer is mounted; the homepage retains the simple manual Add recipe form.

**Implementation effect**

Add one dialog reference, wrap the existing importer in that dialog, add one Add recipe choice and close the importer before opening an imported draft or finished card. No API, parser, database, provider or dependency changes.

**Verification**

The complete 51-test suite, production build, standalone TypeScript check and lint pass; lint retains only the two intentional local-preview image warnings. Local browser inspection confirms that the drawer no longer exposes Instagram controls, Add recipe shows Import link, and that action opens a labelled Instagram dialog.

**Consequences**

The drawer is reserved for finding and opening saved recipes. Instagram remains reachable in two taps without changing how recipes are extracted or saved.

**Reversal path**

Remove the Add recipe choice and dialog wrapper, then return the unchanged importer form above the drawer toolbar.
