import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ImageOcrError, readRecipeImages } from "../db/image-ocr.mjs";
import imageOcrWorker from "../cloudflare/image-ocr-worker.mjs";

const image = (name = "recipe.jpg") => new File(["mock image"], name, { type: "image/jpeg" });
const routeSource = readFileSync(new URL("../app/api/read-images/route.ts", import.meta.url), "utf8");
const journalSource = readFileSync(new URL("../app/recipe-journal.tsx", import.meta.url), "utf8");

test("keeps automatic image reading disabled without protected configuration", async () => {
  await assert.rejects(
    readRecipeImages({ images: [image()], fetcher: async () => assert.fail("must not call a provider") }),
    (error) => error instanceof ImageOcrError && error.code === "not_configured",
  );
});

test("rejects invalid or oversized image batches before external work", async () => {
  const options = { endpoint: "https://worker.example", secret: "mock", fetcher: async () => assert.fail("invalid images must not call a provider") };
  await assert.rejects(readRecipeImages({ ...options, images: [] }), (error) => error.code === "invalid_images");
  await assert.rejects(readRecipeImages({ ...options, images: [image("1.jpg"), image("2.jpg"), image("3.jpg"), image("4.jpg"), image("5.jpg")] }), (error) => error.code === "invalid_images");
  await assert.rejects(readRecipeImages({ ...options, images: [new File(["text"], "recipe.txt", { type: "text/plain" })] }), (error) => error.code === "invalid_images");
  await assert.rejects(readRecipeImages({ ...options, images: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })] }), (error) => error.code === "invalid_images");
});

test("sends all images in one protected mocked request and returns only text", async () => {
  const calls = [];
  const text = await readRecipeImages({
    images: [image("one.jpg"), image("two.jpg")],
    endpoint: "https://worker.example",
    secret: "mock-secret",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ text: "Ingredients:\n200 g paneer\nMethod:\nGrill until golden." });
    },
  });
  assert.match(text, /200 g paneer/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers.authorization, "Bearer mock-secret");
  assert.equal(calls[0].options.body.getAll("images").length, 2);
});

test("route is disabled by default and bounded before multipart parsing", () => {
  assert.match(routeSource, /IMAGE_OCR_ENABLED !== "true"/);
  assert.match(routeSource, /data\.get\("creditConsent"\) !== "true"/);
  assert.match(routeSource, /data\.getAll\("images"\)/);
  assert.match(routeSource, /content-length/);
});

test("wires explicit credit consent to one editable review request", () => {
  assert.match(journalSource, /name="imageOcrConsent"[^>]*type="checkbox"/);
  assert.match(journalSource, /Read selected images — uses API credits/);
  assert.match(journalSource, /fetch\("\/api\/read-images", \{ method: "POST", body \}\)/);
  assert.match(journalSource, /imageText\.value = result\.text/);
  assert.match(journalSource, /Image text ready\. Review and edit it before adding the recipe\./);
});

test("protects the Cloudflare adapter and reads every valid image", async () => {
  const unauthorized = await imageOcrWorker.fetch(new Request("https://worker.example", { method: "POST", body: "x" }), { OCR_SECRET: "secret" });
  assert.equal(unauthorized.status, 401);

  const calls = [];
  const body = new FormData();
  body.append("images", image("one.jpg"));
  body.append("images", image("two.jpg"));
  const request = new Request("https://worker.example", { method: "POST", headers: { authorization: "Bearer secret", "content-length": "1000" }, body });
  const response = await imageOcrWorker.fetch(request, {
    OCR_SECRET: "secret",
    AI: { run: async (model, input) => {
      calls.push({ model, input });
      return { response: `Visible recipe ${calls.length}` };
    } },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "Visible recipe 1\n\nVisible recipe 2" });
  assert.equal(calls.length, 2);
  assert.ok(calls.every(({ input }) => input.image.startsWith("data:image/jpeg;base64,")));
});
