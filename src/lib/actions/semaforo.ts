"use server";

import { revalidatePath } from "next/cache";
import { logDebug } from "@/lib/logger";
import { getSiteUrl } from "@/lib/server-url";

export async function refreshSemaforoAction() {
  try {
    const response = await fetch(`${getSiteUrl()}/api/semaforo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto: true })
    });

    if (!response.ok) {
      const text = await response.text();
      await logDebug("semaforo:refresh_failed", { status: response.status, text });
      throw new Error(`No se pudo refrescar el semáforo (${response.status})`);
    }

    const result = await response.json();
    if (!result.ok) {
      await logDebug("semaforo:refresh_warning", result);
    } else {
      await logDebug("semaforo:refresh_success", result);
    }
  } catch (error) {
    await logDebug("semaforo:refresh_exception", { message: (error as Error).message });
    throw error;
  }

  revalidatePath("/dashboard");
}
