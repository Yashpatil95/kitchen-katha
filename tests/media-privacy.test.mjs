import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const journal = source("../app/recipe-journal.tsx");
const schema = source("../db/schema.ts");
const processing = [
  source("../app/api/transcribe-narration/route.ts"),
  source("../app/api/read-images/route.ts"),
  source("../db/cloudflare-transcription.mjs"),
  source("../db/image-ocr.mjs"),
  source("../cloudflare/image-ocr-worker.mjs"),
].join("\n");

test("discards browser-held raw media after successful processing", () => {
  assert.match(journal, /file\.value = "";\s*consent\.checked = false;\s*setImportMessage\("Transcript ready/);
  assert.match(journal, /setVideoThumbnails\(thumbnails\);\s*event\.currentTarget\.value = "";/);
  assert.match(journal, /setImagePreviews\(previews\);\s*event\.currentTarget\.value = "";/);
  assert.match(journal, /consent\.checked = false;\s*setVideoThumbnails\(\[\]\);\s*setSelectedFrameTimes\(\[\]\);\s*setImagePreviews\(\[\]\);/);
  assert.match(journal, /URL\.revokeObjectURL\(source\)/);
});

test("keeps raw media out of D1 and processing logs", () => {
  assert.doesNotMatch(schema, /blob\(|raw_media|media_data|audio_data|video_data|image_data/i);
  assert.doesNotMatch(processing, /from ["'][^"']*recipes|console\.|\.prepare\(|\.insert\(|\.update\(/);
});
