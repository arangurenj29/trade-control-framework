import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlanDetail, PlanVersion } from "@/lib/dto";
import { levelOptions, phaseOptions } from "@/lib/validations";

export async function getPlanData(userId: string): Promise<{
  activePlan: PlanDetail | null;
  versions: PlanVersion[];
}> {
  const supabase = createServerSupabaseClient();

  const { data: plans, error } = await supabase
    .from("user_plans")
    .select("*")
    .eq("user_id", userId)
    .order("version", { ascending: false });

  if (error) {
    throw error;
  }

  if (!plans || plans.length === 0) {
    return { activePlan: null, versions: [] };
  }

  const [latest, ...rest] = plans;

  const { data: metrics } = await supabase
    .from("metrics_daily")
    .select("pnl_r_dia,pnl_r_semana,streak_dias_verdes,cumplimiento_pct,tp_count")
    .eq("user_id", userId)
    .eq("fecha", new Date().toISOString().slice(0, 10))
    .maybeSingle();

  const horariosRaw = (latest.horarios as PlanDetail["horarios"]) ?? {
    session_start: "09:00",
    session_end: "16:00",
    buffer_minutes: 30
  };

  const safePhase = phaseOptions.includes(latest.fase_actual as (typeof phaseOptions)[number])
    ? latest.fase_actual
    : phaseOptions[1];
  const safeLevel = levelOptions.includes(latest.nivel_actual as (typeof levelOptions)[number])
    ? latest.nivel_actual
    : levelOptions[0];

  const activePlan: PlanDetail = {
    version: latest.version,
    patrimonio: Number(latest.patrimonio),
    r_pct: Number(latest.r_pct),
    sl_diario_r: Number(latest.sl_diario_r),
    sl_semanal_r: Number(latest.sl_semanal_r),
    fase_actual: safePhase,
    nivel_actual: safeLevel,
    r_disponible: Number(latest.patrimonio) * (Number(latest.r_pct) / 100),
    sl_restante_dia: Number(latest.sl_diario_r) - Math.min(Number(metrics?.pnl_r_dia ?? 0), 0),
    sl_restante_semana:
      Number(latest.sl_semanal_r) - Math.min(Number(metrics?.pnl_r_semana ?? 0), 0),
    plan_start_date: latest.effective_from?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    horarios: {
      session_start: horariosRaw.session_start,
      session_end: horariosRaw.session_end,
      buffer_minutes: Number(horariosRaw.buffer_minutes ?? 0)
    },
    no_trade_days: latest.no_trade_days,
    apalancamiento_btceth_max: Number(latest.apalancamiento_btceth_max),
    apalancamiento_alts_max: Number(latest.apalancamiento_alts_max),
    notes: latest.notes
  };

  const versions: PlanVersion[] = [latest, ...rest].map((plan) => {
    const versionPhase = phaseOptions.includes(plan.fase_actual as (typeof phaseOptions)[number])
      ? plan.fase_actual
      : phaseOptions[1];
    const versionLevel = levelOptions.includes(plan.nivel_actual as (typeof levelOptions)[number])
      ? plan.nivel_actual
      : levelOptions[0];

    return {
      id: plan.id,
      version: plan.version,
      patrimonio: Number(plan.patrimonio),
      r_pct: Number(plan.r_pct),
      sl_diario_r: Number(plan.sl_diario_r),
      sl_semanal_r: Number(plan.sl_semanal_r),
      fase_actual: versionPhase,
      nivel_actual: versionLevel,
      plan_start_date: plan.effective_from?.slice(0, 10) ?? "",
      effective_from: plan.effective_from,
      updated_at: plan.updated_at
    };
  });

  return { activePlan, versions };
}
