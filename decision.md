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
