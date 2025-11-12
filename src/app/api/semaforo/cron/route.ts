import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/server-url";

export async function GET() {
  const siteUrl = getSiteUrl();

  try {
    const response = await fetch(`${siteUrl}/api/semaforo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto: true })
    });

    const raw = await response.text();

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: raw }, { status: 500 });
    }

    const data = raw ? JSON.parse(raw) : null;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
