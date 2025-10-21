import { NextResponse } from "next/server";
import { buildDefaultSemaforoInput } from "@/lib/services/semaforo";

export async function GET() {
  const payload = buildDefaultSemaforoInput();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const response = await fetch(`${siteUrl}/api/semaforo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { ok: false, error: text },
      { status: 500 }
    );
  }

  const data = await response.json();
  return NextResponse.json({ ok: true, data });
}
