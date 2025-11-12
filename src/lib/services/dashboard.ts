import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardData, PlanSummary, SemaforoState } from "@/lib/dto";
import { getEasternDateString } from "@/lib/dates";

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createServerSupabaseClient();
  const today = getEasternDateString();

  const [semaforoRes, planRes, metricsRes, ascensoRes] = await Promise.all([
    supabase
      .from("global_semaforo_daily")
      .select("fecha,estado,explicacion_gpt,computed_at,indicadores_json")
      .eq("fecha", today)
      .maybeSingle(),
    supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("metrics_daily")
      .select("pnl_r_dia,pnl_r_semana,tp_count,streak_dias_verdes,cumplimiento_pct")
      .eq("user_id", userId)
      .eq("fecha", today)
      .maybeSingle(),
    supabase
      .from("gamification_state")
      .select("xp,level_perfil,badges_json,streak_cumplimiento")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  const isNoRows = (error: { code?: string } | null) => error?.code === "PGRST116";

  if (semaforoRes.error && !isNoRows(semaforoRes.error)) throw semaforoRes.error;
  if (planRes.error && !isNoRows(planRes.error)) throw planRes.error;
  if (metricsRes.error && !isNoRows(metricsRes.error)) throw metricsRes.error;
  if (ascensoRes.error && !isNoRows(ascensoRes.error)) throw ascensoRes.error;

  const plan = planRes.data ?? null;
  const metrics = metricsRes.data ?? null;

  const planSummary: PlanSummary | null = plan
    ? {
        version: plan.version,
        patrimonio: Number(plan.patrimonio),
        fase_actual: plan.fase_actual,
        nivel_actual: plan.nivel_actual,
        sl_diario_r: Number(plan.sl_diario_r),
        sl_semanal_r: Number(plan.sl_semanal_r),
        r_pct: Number(plan.r_pct),
        r_disponible: Number(plan.patrimonio) * (Number(plan.r_pct) / 100),
        sl_restante_dia: Number(plan.sl_diario_r) - Math.min(Number(metrics?.pnl_r_dia ?? 0), 0),
        sl_restante_semana:
          Number(plan.sl_semanal_r) - Math.min(Number(metrics?.pnl_r_semana ?? 0), 0),
        apalancamiento_btceth_max: Number(plan.apalancamiento_btceth_max ?? 0),
        apalancamiento_alts_max: Number(plan.apalancamiento_alts_max ?? 0),
        plan_start_date: plan.effective_from?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
      }
    : null;

  const parsedIndicadores = semaforoRes.data?.indicadores_json as
    | {
        parsed?: { raw?: string };
        error?: string | null;
      }
    | undefined;

  const semaforo: SemaforoState | null = semaforoRes.data
    ? {
        fecha: semaforoRes.data.fecha,
        estado: semaforoRes.data.estado,
        explicacion: semaforoRes.data.explicacion_gpt,
        computed_at: semaforoRes.data.computed_at ?? null,
        analisis: parsedIndicadores?.parsed?.raw ?? null,
        error: parsedIndicadores?.error ?? null
      }
    : null;

  const ascenso = ascensoRes.data
    ? {
        xp: ascensoRes.data.xp,
        level_perfil: ascensoRes.data.level_perfil,
        badges: (ascensoRes.data.badges_json as string[]) ?? [],
        streak_cumplimiento: ascensoRes.data.streak_cumplimiento
      }
    : null;

  const canOperateInfo = evaluateBlocking(planSummary, metrics, semaforo);

  return {
    semaforo,
    plan: planSummary,
    metrics: metrics
      ? {
          pnl_r_dia: Number(metrics.pnl_r_dia ?? 0),
          pnl_r_semana: Number(metrics.pnl_r_semana ?? 0),
          tp_count: metrics.tp_count ?? 0,
          streak_dias_verdes: metrics.streak_dias_verdes ?? 0,
          cumplimiento_pct: Number(metrics.cumplimiento_pct ?? 0)
        }
      : null,
    ascenso,
    can_operate: canOperateInfo.canOperate,
    bloqueo_motivo: canOperateInfo.motivo
  };
}

function evaluateBlocking(
  plan: PlanSummary | null,
  metrics: { pnl_r_dia?: number | string | null; pnl_r_semana?: number | string | null } | null,
  semaforo: SemaforoState | null
) {
  if (!plan) {
    return { canOperate: false, motivo: "Configura tu plan para habilitar operaciones." };
  }

  if (semaforo?.estado === "Rojo") {
    return { canOperate: false, motivo: "Semáforo en rojo." };
  }

  const pnlDia = Number(metrics?.pnl_r_dia ?? 0);
  const pnlSemana = Number(metrics?.pnl_r_semana ?? 0);

  if (pnlDia <= plan.sl_diario_r) {
    return { canOperate: false, motivo: "SL diario alcanzado." };
  }

  if (pnlSemana <= plan.sl_semanal_r) {
    return { canOperate: false, motivo: "SL semanal alcanzado." };
  }

  return { canOperate: true, motivo: null };
}
