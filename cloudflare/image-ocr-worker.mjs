const MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 20 * 1024 * 1024 + 128 * 1024;

const json = (body, status = 200) => Response.json(body, { status });

function base64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!env.OCR_SECRET || request.headers.get("authorization") !== `Bearer ${env.OCR_SECRET}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    const length = Number(request.headers.get("content-length"));
    if (!Number.isFinite(length) || length <= 0 || length > MAX_REQUEST_BYTES) {
      return json({ error: "Image batch must be no larger than 20 MB" }, 413);
    }

    try {
      const images = (await request.formData()).getAll("images");
      if (images.length < 1 || images.length > MAX_IMAGES || images.some((image) =>
        !(image instanceof File) || !image.type.startsWith("image/") || !image.size || image.size > MAX_IMAGE_BYTES
      )) return json({ error: "Choose one to four images, no larger than 5 MB each" }, 400);

      const readings = [];
      for (const image of images) {
        const encoded = base64(new Uint8Array(await image.arrayBuffer()));
        const result = await env.AI.run(MODEL, {
          prompt: "Transcribe only the visible recipe title, ingredients, quantities, and method. Preserve wording and order. Do not guess missing text or describe the image.",
          image: `data:${image.type};base64,${encoded}`,
          max_tokens: 1800,
          temperature: 0,
        });
        if (typeof result?.response !== "string" || !result.response.trim()) throw new Error("Empty model response");
        readings.push(result.response.trim());
      }
      return json({ text: readings.join("\n\n") });
    } catch {
      return json({ error: "Image reading failed" }, 502);
    }
  },
};
