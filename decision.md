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
