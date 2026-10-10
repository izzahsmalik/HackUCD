/** LLM confidence at or above which an automated decision is taken; below goes to the action queue. */
export const MATCH_CONFIDENCE = 0.8;

/** Directory scanned by POST /ingest/run when the request and env give no other. */
export const DEFAULT_INGEST_DIRECTORY = 'data/ingest';

/** Rows per LLM call when parsing CSV batches. */
export const DEFAULT_BATCH_SIZE = 25;

/** Max product names passed to the LLM in one matching call. */
export const MAX_PRODUCTS_PER_CALL = 150;

/** Max accepted upload size in bytes (overridable via UPLOAD_MAX_BYTES). */
export const MAX_UPLOAD_BYTES =
  Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024;
