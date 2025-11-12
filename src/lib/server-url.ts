const LOCAL_FALLBACK_URL = "http://localhost:3000";

function normalizeUrl(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

/**
 * Returns the canonical site URL for server-side fetches/jobs.
 * Prefers explicit env vars, falls back to Vercel auto URL or localhost.
 */
export function getSiteUrl() {
  return (
    normalizeUrl(process.env.SITE_URL) ??
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    LOCAL_FALLBACK_URL
  );
}
