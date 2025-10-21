"use server";

import { revalidatePath } from "next/cache";
import { planSchema } from "@/lib/validations";
import { requireSessionProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function upsertPlanAction(rawValues: unknown) {
  const profile = await requireSessionProfile();
  const parsed = planSchema.safeParse(rawValues);

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(", "));
  }

  const supabase = createServerSupabaseClient();

  const { data: lastVersion } = await supabase
    .from("user_plans")
    .select("version")
    .eq("user_id", profile.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  const { error } = await supabase.from("user_plans").insert({
    user_id: profile.id,
    version: nextVersion,
    patrimonio: parsed.data.patrimonio,
    r_pct: parsed.data.r_pct,
    sl_diario_r: parsed.data.sl_diario_r,
    sl_semanal_r: parsed.data.sl_semanal_r,
    horarios: parsed.data.horarios,
    no_trade_days: parsed.data.no_trade_days,
    apalancamiento_btceth_max: parsed.data.apalancamiento_btceth_max,
    apalancamiento_alts_max: parsed.data.apalancamiento_alts_max,
    fase_actual: parsed.data.fase_actual,
    nivel_actual: parsed.data.nivel_actual,
    notes: parsed.data.notes,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }

  await supabase.from("audit_logs").insert({
    user_id: profile.id,
    action: "plan.upsert",
    payload: { version: nextVersion },
    created_at: new Date().toISOString()
  });

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}
