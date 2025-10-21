const SERVER_ENABLED = process.env.DEBUG_LOGS === "true";
const CLIENT_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";

export async function logDebug(event: string, payload?: unknown) {
  if (typeof window === "undefined") {
    if (!SERVER_ENABLED) return;
    console.info("[DEBUG]", new Date().toISOString(), event, payload ?? null);
    return;
  }

  if (!CLIENT_ENABLED) return;

  try {
    await fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload })
    });
  } catch (error) {
    console.warn("[DEBUG] logger failed", error);
  }
}
