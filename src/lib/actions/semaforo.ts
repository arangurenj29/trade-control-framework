"use server";

import { revalidatePath } from "next/cache";
import { buildDefaultSemaforoInput } from "@/lib/services/semaforo";
import { logDebug } from "@/lib/logger";

export async function refreshSemaforoAction() {
  const payload = buildDefaultSemaforoInput();

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/semaforo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      await logDebug("semaforo:refresh_failed", { status: response.status, text });
      throw new Error(`No se pudo refrescar el semáforo (${response.status})`);
    }

    const result = await response.json();
    await logDebug("semaforo:refresh_success", result);
  } catch (error) {
    await logDebug("semaforo:refresh_exception", { message: (error as Error).message });
    throw error;
  }

  revalidatePath("/dashboard");
}
