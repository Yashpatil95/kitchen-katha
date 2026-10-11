export const ownerAccessStatus = (request, ownerId) => {
  const hostname = new URL(request.url).hostname;
  if (["localhost", "127.0.0.1", "::1"].includes(hostname)) return 0;
  if (!ownerId) return 503;
  return request.headers.get("oai-authenticated-user-id") === ownerId ? 0 : 401;
};

export const rateLimitFor = (pathname) => ({
  "/api/transcribe-narration": 5,
  "/api/read-images": 5,
  "/api/import-instagram": 20,
})[pathname] || 0;

export async function consumeRateLimit(db, key, limit, now = Date.now()) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS request_rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      request_count INTEGER NOT NULL
    )
  `).run();
  const windowStart = Math.floor(now / 60_000) * 60_000;
  const row = await db.prepare(`
    INSERT INTO request_rate_limits (key, window_start, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      window_start = excluded.window_start,
      request_count = CASE
        WHEN request_rate_limits.window_start = excluded.window_start
          THEN request_rate_limits.request_count + 1
        ELSE 1
      END
    RETURNING request_count
  `).bind(key, windowStart).first();
  return Number(row?.request_count) <= limit;
}
