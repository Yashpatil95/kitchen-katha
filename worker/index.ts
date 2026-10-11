/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { consumeRateLimit, ownerAccessStatus, rateLimitFor } from "../db/request-security.mjs";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  KITCHEN_KATHA_OWNER_ID?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const accessStatus = ownerAccessStatus(request, env.KITCHEN_KATHA_OWNER_ID);
    if (accessStatus) {
      return Response.json(
        { error: accessStatus === 401 ? "Owner access is required." : "Owner access is not configured." },
        { status: accessStatus },
      );
    }
    const limit = rateLimitFor(url.pathname);
    if (limit && !await consumeRateLimit(env.DB, `${env.KITCHEN_KATHA_OWNER_ID}:${url.pathname}`, limit)) {
      return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
