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

The homepage no longer loads recipe records or renders the recipe section. A new server-rendered `/recipes` page loads the existing D1 collection. The shared header provides two-way navigation, and dialogs use fixed viewport positioning, automatic margins and internal scrolling for long content.

**Verification**

Both `/` and `/recipes` returned HTTP 200 locally. The production build completed successfully, focused lint passed, and both recipe-input boundary checks passed on 2026-09-05.

**Consequences**

Kitchen Katha has a cleaner homepage, a directly addressable recipe workspace and consistently centred add/edit and recipe-detail popups without changing stored recipes.

**Reversal path**

Render both sections from the homepage again, remove the `/recipes` route and restore the previous dialog positioning; no data migration would be required.
