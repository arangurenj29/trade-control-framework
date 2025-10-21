function serverDebugEnabled() {
  return (process.env.DEBUG_LOGS ?? "false").toLowerCase() === "true";
}

function clientDebugEnabled() {
  return (typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_DEBUG_LOGS ?? "false").toLowerCase() === "true");
}

export async function logDebug(event: string, payload?: unknown) {
  if (typeof window === "undefined") {
    if (!serverDebugEnabled()) return;
    console.info("[DEBUG]", new Date().toISOString(), event, payload ?? null);
    return;
  }

  if (!clientDebugEnabled()) return;

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
