import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dataUrlToImageFile, sampleFrameTimes, toggleBoundedSelection } from "../db/video-frames.mjs";

const journalSource = readFileSync(new URL("../app/recipe-journal.tsx", import.meta.url), "utf8");

test("samples evenly spaced frames away from the video edges", () => {
  assert.deepEqual(sampleFrameTimes(70, 6), [10, 20, 30, 40, 50, 60]);
  assert.deepEqual(sampleFrameTimes(0), []);
});

test("selects at most four images across frames and reserved uploads", () => {
  assert.deepEqual(toggleBoundedSelection([10, 20], 30, 1), [10, 20, 30]);
  assert.deepEqual(toggleBoundedSelection([10, 20, 30], 40, 1), [10, 20, 30]);
  assert.deepEqual(toggleBoundedSelection([10, 20], 20, 2), [10]);
});

test("converts a local image preview back into a bounded upload file", async () => {
  const file = dataUrlToImageFile("data:image/jpeg;base64,cGFuZWVy", "frame-1.jpg");
  assert.equal(file.name, "frame-1.jpg");
  assert.equal(file.type, "image/jpeg");
  assert.equal(await file.text(), "paneer");
  assert.throws(() => dataUrlToImageFile("https://example.com/image.jpg", "bad.jpg"), /Invalid image preview/);
});

test("keeps frame extraction local and dependency-free", () => {
  assert.match(journalSource, /document\.createElement\("video"\)/);
  assert.match(journalSource, /document\.createElement\("canvas"\)/);
  assert.match(journalSource, /canvas\.toDataURL\("image\/jpeg", 0\.72\)/);
  assert.match(journalSource, /accept="image\/\*"[^>]*multiple/);
  assert.match(journalSource, /fetch\("\/api\/read-images"/);
  assert.doesNotMatch(journalSource, /fetch\([^)]*frame/i);
});
