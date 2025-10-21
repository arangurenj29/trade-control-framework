"use server";

import { revalidatePath } from "next/cache";
import { requireSessionProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { emotionalLogSchema } from "@/lib/validations";

export type EmotionalActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function upsertEmotionalLogAction(
  prevState: EmotionalActionState,
  formData: FormData
): Promise<EmotionalActionState> {
  const profile = await requireSessionProfile();

  const values = {
    log_date: formData.get("log_date"),
    estado_antes: formData.get("estado_antes"),
    estado_despues: formData.get("estado_despues"),
    confianza: formData.get("confianza"),
    cansancio: formData.get("cansancio"),
    claridad: formData.get("claridad"),
    emocion_dominante: formData.get("emocion_dominante") ?? "",
    reflexion: formData.get("reflexion") ?? "",
    gratitud: formData.get("gratitud") ?? ""
  };

  const parsed = emotionalLogSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors.map((err) => err.message).join(". ")
    };
  }

  const supabase = createServerSupabaseClient();
  const payload = {
    user_id: profile.id,
    log_date: parsed.data.log_date.toISOString().slice(0, 10),
    estado_antes: parsed.data.estado_antes,
    estado_despues: parsed.data.estado_despues,
    confianza: parsed.data.confianza,
    cansancio: parsed.data.cansancio,
    claridad: parsed.data.claridad,
    emocion_dominante: parsed.data.emocion_dominante,
    reflexion: parsed.data.reflexion,
    gratitud: parsed.data.gratitud,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("emotional_logs")
    .upsert(payload, { onConflict: "user_id,log_date" });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/bitacora");
  revalidatePath("/dashboard");
  revalidatePath("/ascenso");

  return {
    status: "success",
    message: "Bitácora guardada"
  };
}
