import { NextResponse } from "next/server";

const enabled = process.env.DEBUG_LOGS === "true";

export async function POST(request: Request) {
  if (!enabled) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  const body = await request.json().catch(() => ({}));
  const { event = "unknown", payload = null } = body as {
    event?: string;
    payload?: unknown;
  };

  console.info("[DEBUG]", new Date().toISOString(), event, payload);

  return NextResponse.json({ ok: true });
}
