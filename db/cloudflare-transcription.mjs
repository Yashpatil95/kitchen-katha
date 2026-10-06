const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const MAX_DURATION_SECONDS = 5 * 60;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_TRANSCRIPT_LENGTH = 100_000;

export class NarrationTranscriptionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "NarrationTranscriptionError";
    this.code = code;
  }
}

const responseText = async (response) => {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
    throw new NarrationTranscriptionError("invalid_response", "The transcription service returned too much data.");
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
      throw new NarrationTranscriptionError("invalid_response", "The transcription service returned too much data.");
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

export async function transcribeNarration({ file, durationSeconds, endpoint, secret, fetcher = fetch }) {
  if (!endpoint || !secret) {
    throw new NarrationTranscriptionError("not_configured", "Automatic narration transcription is not enabled.");
  }
  if (!(file instanceof Blob) || !file.type.match(/^(audio|video)\//)) {
    throw new NarrationTranscriptionError("invalid_file", "Choose one audio or video file.");
  }
  if (!file.size || file.size > MAX_MEDIA_BYTES) {
    throw new NarrationTranscriptionError("invalid_file", "The file must be no larger than 20 MB.");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_DURATION_SECONDS) {
    throw new NarrationTranscriptionError("invalid_duration", "The recording must be no longer than five minutes.");
  }

  const body = new FormData();
  body.set("file", file, file.name || "narration");
  body.set("durationSeconds", String(durationSeconds));

  let response;
  try {
    response = await fetcher(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      body,
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new NarrationTranscriptionError("provider_unavailable", "Narration transcription is temporarily unavailable.");
  }
  if (!response.ok) {
    throw new NarrationTranscriptionError("provider_error", "Narration transcription failed. No recipe was saved.");
  }

  let payload;
  try {
    payload = JSON.parse(await responseText(response));
  } catch (error) {
    if (error instanceof NarrationTranscriptionError) throw error;
    throw new NarrationTranscriptionError("invalid_response", "The transcription service returned an invalid response.");
  }
  const transcript = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!transcript || transcript.length > MAX_TRANSCRIPT_LENGTH) {
    throw new NarrationTranscriptionError("invalid_response", "The transcription service returned an invalid transcript.");
  }
  return transcript;
}
