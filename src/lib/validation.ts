/**
 * Small dependency-free helpers shared by API routes and tests.
 */

/** True only for absolute http(s) URLs. Rejects javascript:, data:, file:, etc. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parse a positive integer query parameter safely.
 * Non-numeric, fractional, zero/negative or missing values fall back to
 * `fallback`; the result is clamped to `max`.
 */
export function parsePositiveInt(
  raw: string | null | undefined,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

/** Serialize JSON for safe embedding inside an inline <script> tag. */
export function jsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
