declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    IMAGE_OCR_ENABLED?: string;
    IMAGE_OCR_SECRET?: string;
    IMAGE_OCR_URL?: string;
    KITCHEN_KATHA_OWNER_ID?: string;
    KITCHEN_KATHA_OWNER_EMAIL?: string;
    NARRATION_TRANSCRIPTION_ENABLED?: string;
    CLOUDFLARE_TRANSCRIPTION_SECRET?: string;
    CLOUDFLARE_TRANSCRIPTION_URL?: string;
  }
}
