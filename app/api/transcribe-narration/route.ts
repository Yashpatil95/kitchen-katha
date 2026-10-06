import { env } from "cloudflare:workers";
import { NarrationTranscriptionError, transcribeNarration } from "../../../db/cloudflare-transcription.mjs";

const MAX_MULTIPART_BYTES = 20 * 1024 * 1024 + 64 * 1024;

export async function POST(request: Request) {
  const runtime = env as typeof env & {
    CLOUDFLARE_TRANSCRIPTION_URL?: string;
    CLOUDFLARE_TRANSCRIPTION_SECRET?: string;
    NARRATION_TRANSCRIPTION_ENABLED?: string;
  };
  if (runtime.NARRATION_TRANSCRIPTION_ENABLED !== "true" || !runtime.CLOUDFLARE_TRANSCRIPTION_URL || !runtime.CLOUDFLARE_TRANSCRIPTION_SECRET) {
    return Response.json({ error: "Automatic narration transcription is not enabled." }, { status: 503 });
  }

  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0 || length > MAX_MULTIPART_BYTES) {
    return Response.json({ error: "The upload must be no larger than 20 MB." }, { status: 413 });
  }

  try {
    const data = await request.formData();
    if (data.get("creditConsent") !== "true") {
      return Response.json({ error: "Confirm that the selected file may be sent for transcription." }, { status: 400 });
    }
    const transcript = await transcribeNarration({
      file: data.get("file"),
      durationSeconds: Number(data.get("durationSeconds")),
      endpoint: runtime.CLOUDFLARE_TRANSCRIPTION_URL,
      secret: runtime.CLOUDFLARE_TRANSCRIPTION_SECRET,
    });
    return Response.json({ transcript });
  } catch (error) {
    const known = error instanceof NarrationTranscriptionError ? error : null;
    const status = known?.code === "invalid_file" || known?.code === "invalid_duration" ? 400 : 502;
    return Response.json({ error: known?.message || "Narration transcription failed. No recipe was saved." }, { status });
  }
}
