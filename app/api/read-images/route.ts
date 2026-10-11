import { env } from "cloudflare:workers";
import { ImageOcrError, readRecipeImages } from "../../../db/image-ocr.mjs";

const MAX_MULTIPART_BYTES = 20 * 1024 * 1024 + 128 * 1024;

export async function POST(request: Request) {
  const runtime = env as typeof env & {
    IMAGE_OCR_ENABLED?: string;
    IMAGE_OCR_URL?: string;
    IMAGE_OCR_SECRET?: string;
  };
  if (runtime.IMAGE_OCR_ENABLED !== "true" || !runtime.IMAGE_OCR_URL || !runtime.IMAGE_OCR_SECRET) {
    return Response.json({ error: "Automatic image reading is not enabled." }, { status: 503 });
  }

  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0 || length > MAX_MULTIPART_BYTES) {
    return Response.json({ error: "The image batch must be no larger than 20 MB." }, { status: 413 });
  }

  try {
    const data = await request.formData();
    if (data.get("creditConsent") !== "true") {
      return Response.json({ error: "Confirm that the selected images may be sent for reading." }, { status: 400 });
    }
    const text = await readRecipeImages({
      images: data.getAll("images"),
      endpoint: runtime.IMAGE_OCR_URL,
      secret: runtime.IMAGE_OCR_SECRET,
    });
    return Response.json({ text });
  } catch (error) {
    const known = error instanceof ImageOcrError ? error : null;
    const status = known?.code === "invalid_images" ? 400 : 502;
    return Response.json({ error: known?.message || "Image reading failed. No recipe was saved." }, { status });
  }
}
