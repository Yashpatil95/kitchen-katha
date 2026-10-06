import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NarrationTranscriptionError, transcribeNarration } from "../db/cloudflare-transcription.mjs";

const file = new File(["mock audio"], "narration.webm", { type: "audio/webm" });
const journalSource = readFileSync(new URL("../app/recipe-journal.tsx", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../app/api/transcribe-narration/route.ts", import.meta.url), "utf8");

test("keeps automatic transcription disabled without the protected endpoint", async () => {
  await assert.rejects(
    transcribeNarration({ file, durationSeconds: 30, fetcher: async () => assert.fail("must not call Cloudflare") }),
    (error) => error instanceof NarrationTranscriptionError && error.code === "not_configured",
  );
});

test("validates media and duration before external work", async () => {
  const fetcher = async () => assert.fail("invalid media must not call Cloudflare");
  const options = { endpoint: "https://worker.example", secret: "mock", fetcher };
  await assert.rejects(
    transcribeNarration({ ...options, file: new File(["text"], "recipe.txt", { type: "text/plain" }), durationSeconds: 30 }),
    (error) => error.code === "invalid_file",
  );
  await assert.rejects(
    transcribeNarration({ ...options, file, durationSeconds: 301 }),
    (error) => error.code === "invalid_duration",
  );
  await assert.rejects(
    transcribeNarration({ ...options, file: new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.webm", { type: "audio/webm" }), durationSeconds: 30 }),
    (error) => error.code === "invalid_file",
  );
});

test("makes one protected multipart request and returns only the mocked transcript", async () => {
  const calls = [];
  const transcript = await transcribeNarration({
    file,
    durationSeconds: 30,
    endpoint: "https://worker.example",
    secret: "mock-secret",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ text: "Paneer tikka narration" });
    },
  });

  assert.equal(transcript, "Paneer tikka narration");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://worker.example");
  assert.equal(calls[0].options.headers.authorization, "Bearer mock-secret");
  assert.equal(calls[0].options.body.get("durationSeconds"), "30");
  assert.equal(calls[0].options.body.get("file").name, "narration.webm");
});

test("wires explicit upload consent to a disabled-by-default review flow", () => {
  assert.match(journalSource, /name="narrationFile"[^>]*accept="audio\/\*,video\/\*"/);
  assert.match(journalSource, /name="transcriptionConsent"[^>]*type="checkbox"/);
  assert.match(journalSource, /fetch\("\/api\/transcribe-narration"/);
  assert.match(journalSource, /Transcript ready\. Review and edit it before adding the recipe\./);
  assert.match(routeSource, /NARRATION_TRANSCRIPTION_ENABLED !== "true"/);
  assert.match(routeSource, /CLOUDFLARE_TRANSCRIPTION_URL/);
  assert.match(routeSource, /data\.get\("creditConsent"\) !== "true"/);
  assert.match(routeSource, /content-length/);
});
