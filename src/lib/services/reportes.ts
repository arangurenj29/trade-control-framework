import { endOfWeek, startOfWeek } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WeeklyReportData } from "@/lib/dto";

export async function getWeeklyReportData(userId: string): Promise<WeeklyReportData | null> {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  const startWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endWeekDate = endOfWeek(today, { weekStartsOn: 1 });

  const [tradesRes, metricsRes, planRes] = await Promise.all([
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "closed")
      .gte("close_time", startWeek.toISOString())
      .lte("close_time", endWeekDate.toISOString()),
    supabase
      .from("metrics_daily")
      .select("fecha,pnl_r_dia,pnl_r_semana,cumplimiento_pct,streak_dias_verdes")
      .eq("user_id", userId)
      .gte("fecha", startWeek.toISOString().slice(0, 10))
      .lte("fecha", endWeekDate.toISOString().slice(0, 10))
      .order("fecha", { ascending: true }),
    supabase
      .from("user_plans")
      .select("sl_diario_r,sl_semanal_r")
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (tradesRes.error) throw tradesRes.error;
  if (metricsRes.error) throw metricsRes.error;
  if (planRes.error) throw planRes.error;

  const trades = tradesRes.data ?? [];
  const metrics = metricsRes.data ?? [];
  const plan = planRes.data;

  if (trades.length === 0 && metrics.length === 0) {
    return null;
  }

  const pnlR = trades.reduce((acc, trade) => acc + Number(trade.pnl_r ?? 0), 0);
  const pnlMonetario = trades.reduce((acc, trade) => acc + Number(trade.pnl_monetario ?? 0), 0);
  const cumplimientoPromedio =
    metrics.length > 0
      ? metrics.reduce((acc, item) => acc + Number(item.cumplimiento_pct ?? 0), 0) /
        metrics.length
      : 0;

  const streakActual = metrics.length > 0 ? metrics[metrics.length - 1].streak_dias_verdes ?? 0 : 0;

  const violaciones = {
    sl_diario:
      metrics.filter((item) => Number(item.pnl_r_dia ?? 0) <= Number(plan?.sl_diario_r ?? -2)).length,
    sl_semanal:
      metrics.filter((item) => Number(item.pnl_r_semana ?? 0) <= Number(plan?.sl_semanal_r ?? -6)).length
  };

  const recomendacion = buildRecommendation(pnlR, cumplimientoPromedio, streakActual, plan);

  return {
    rango: {
      inicio: startWeek.toISOString(),
      fin: endWeekDate.toISOString()
    },
    pnl_r: pnlR,
    pnl_monetario: pnlMonetario,
    cumplimiento_pct: cumplimientoPromedio,
    streak_dias_verdes: streakActual,
    violaciones,
    recomendacion_fase: recomendacion,
    trades: trades.map((trade) => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      type: trade.type,
      exchange: trade.exchange,
      entry: Number(trade.entry),
      sl: Number(trade.sl),
      leverage: Number(trade.leverage),
      size_nominal: Number(trade.size_nominal),
      risk_en_r: Number(trade.risk_en_r),
      status: trade.status,
      open_time: trade.open_time,
      close_time: trade.close_time,
      pnl_r: trade.pnl_r !== null ? Number(trade.pnl_r) : null,
      cumplimiento_flags: trade.cumplimiento_flags ?? []
    }))
  };
}

function buildRecommendation(
  pnlR: number,
  cumplimiento: number,
  streak: number,
  plan: { sl_semanal_r: string; sl_diario_r: string } | null
) {
  if (!plan) return null;

  if (cumplimiento >= 85 && (streak >= 10 || pnlR >= 0)) {
    return "Cumplimiento sólido: considera promover de nivel si los parámetros lo permiten.";
  }

  if (pnlR <= Number(plan.sl_semanal_r)) {
    return "Revisa tu gestión de riesgo: sugerida una pausa y posible democión temporal.";
  }

  return "Mantén parámetros actuales y enfócate en la consistencia diaria.";
}
