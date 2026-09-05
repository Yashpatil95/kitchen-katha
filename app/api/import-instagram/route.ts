import { instagramUrl, parseInstagramCaption } from "../../../db/instagram-recipe.mjs";

const decodeHtml = (value: string) => value
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const publicCaption = async (url: string) => {
  const response = await fetch(url, {
    headers: { "user-agent": "Kitchen Katha recipe importer" },
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Instagram did not make this caption public.");
  const length = Number(response.headers.get("content-length"));
  if (length > 1_000_000) throw new Error("This Instagram page is too large to import safely.");
  const html = (await response.text()).slice(0, 1_000_000);
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    const property = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (!['og:description', 'description'].includes(property || "")) continue;
    const content = tag.match(/content=["']([\s\S]*?)["'](?:\s|\/?>)/i)?.[1];
    if (!content) continue;
    const decoded = decodeHtml(content);
    const quoted = decoded.match(/:\s*[“"]([\s\S]+)[”"]\s*$/)?.[1];
    return (quoted || decoded).trim();
  }
  throw new Error("Instagram did not expose a readable caption.");
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { url?: unknown; caption?: unknown };
    const sourceUrl = instagramUrl(payload.url);
    const pasted = typeof payload.caption === "string" ? payload.caption.trim().slice(0, 20_000) : "";
    const caption = pasted || await publicCaption(sourceUrl);
    return Response.json(parseInstagramCaption(caption, sourceUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "This recipe could not be imported.";
    return Response.json({ error: `${message} You can paste the recipe caption underneath the link and try again.` }, { status: 422 });
  }
}
