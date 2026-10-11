const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_TEXT_LENGTH = 50_000;

export class ImageOcrError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ImageOcrError";
    this.code = code;
  }
}

const responseText = async (response) => {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
    throw new ImageOcrError("invalid_response", "The image-reading service returned too much data.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new ImageOcrError("invalid_response", "The image-reading service returned too much data.");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
};

export async function readRecipeImages({ images, endpoint, secret, fetcher = fetch }) {
  if (!endpoint || !secret) throw new ImageOcrError("not_configured", "Automatic image reading is not enabled.");
  if (!Array.isArray(images) || images.length < 1 || images.length > MAX_IMAGES) {
    throw new ImageOcrError("invalid_images", "Choose between one and four images.");
  }
  if (images.some((image) => !(image instanceof Blob) || !image.type.startsWith("image/") || !image.size || image.size > MAX_IMAGE_BYTES)) {
    throw new ImageOcrError("invalid_images", "Each file must be an image no larger than 5 MB.");
  }
  if (images.reduce((total, image) => total + image.size, 0) > MAX_TOTAL_BYTES) {
    throw new ImageOcrError("invalid_images", "The image batch must be no larger than 20 MB.");
  }

  const body = new FormData();
  images.forEach((image, index) => body.append("images", image, image.name || `recipe-image-${index + 1}`));
  let response;
  try {
    response = await fetcher(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      body,
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new ImageOcrError("provider_unavailable", "Automatic image reading is temporarily unavailable.");
  }
  if (!response.ok) throw new ImageOcrError("provider_error", "Image reading failed. No recipe was saved.");

  let payload;
  try {
    payload = JSON.parse(await responseText(response));
  } catch (error) {
    if (error instanceof ImageOcrError) throw error;
    throw new ImageOcrError("invalid_response", "The image-reading service returned an invalid response.");
  }
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!text || text.length > MAX_TEXT_LENGTH) {
    throw new ImageOcrError("invalid_response", "The image-reading service returned invalid text.");
  }
  return text;
}
