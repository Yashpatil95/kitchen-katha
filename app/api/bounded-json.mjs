export class RequestBodyError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

export async function boundedJson(request, maxBytes) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RequestBodyError(413, "This request is too large.");
  }
  if (!request.body) throw new RequestBodyError(400, "Send a JSON request body.");

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new RequestBodyError(413, "This request is too large.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new RequestBodyError(400, "Send valid JSON.");
  }
}
