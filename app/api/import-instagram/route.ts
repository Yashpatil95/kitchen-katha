import { captionFromInstagramHtml, instagramUrl, parseInstagramCaption } from "../../../db/instagram-recipe.mjs";
import { createRecipe, listRecipes, parseRecipeDraft } from "../../../db/recipes";

const publicCaption = async (url: string) => {
  for (const candidate of [`${url}embed/captioned/`, url]) {
    try {
      const response = await fetch(candidate, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; KitchenKatha/1.0)" },
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;
      const length = Number(response.headers.get("content-length"));
      if (length > 1_000_000) continue;
      return captionFromInstagramHtml((await response.text()).slice(0, 1_000_000));
    } catch {
      continue;
    }
  }
  throw new Error("Instagram did not make this caption public.");
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { url?: unknown };
    const sourceUrl = instagramUrl(payload.url);
    const existing = (await listRecipes()).find((recipe) => recipe.sourceUrl === sourceUrl);
    if (existing) return Response.json({ recipe: existing, alreadySaved: true });

    const { draft, warnings } = parseInstagramCaption(await publicCaption(sourceUrl), sourceUrl);
    if (warnings.length) throw new Error("The public caption does not contain a complete ingredient list and method.");
    const recipe = await createRecipe(parseRecipeDraft(draft));
    return Response.json({ recipe }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "This recipe could not be imported.";
    return Response.json({ error: `${message} Nothing was saved.` }, { status: 422 });
  }
}
