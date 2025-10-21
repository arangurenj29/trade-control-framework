"use server";

import { revalidatePath } from "next/cache";
import {
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek
} from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";

export async function recomputeMetricsFromTrades(userId: string) {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  const startDay = startOfDay(today).toISOString();
  const endDay = endOfDay(today).toISOString();
  const startWeek = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const endWeek = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

  const [{ data: tradesToday, error: tradesTodayError }, { data: tradesWeek, error: tradesWeekError }, { data: previousMetrics }] = await Promise.all([
    supabase
      .from("trades")
      .select("pnl_r,cumplimiento_flags,close_time")
      .eq("user_id", userId)
      .eq("status", "closed")
      .gte("close_time", startDay)
      .lte("close_time", endDay),
    supabase
      .from("trades")
      .select("pnl_r,close_time")
      .eq("user_id", userId)
      .eq("status", "closed")
      .gte("close_time", startWeek)
      .lte("close_time", endWeek),
    supabase
      .from("metrics_daily")
      .select("streak_dias_verdes")
      .eq("user_id", userId)
      .eq("fecha", new Date(today.getTime() - 86400000).toISOString().slice(0, 10))
      .maybeSingle()
  ]);

  if (tradesTodayError) throw tradesTodayError;
  if (tradesWeekError) throw tradesWeekError;

  const pnlDia = sum(tradesToday?.map((t) => t.pnl_r) ?? []);
  const pnlSemana = sum(tradesWeek?.map((t) => t.pnl_r) ?? []);
  const tpCount = tradesToday?.filter((t) => Number(t.pnl_r ?? 0) >= 1).length ?? 0;
  const slHits48h = tradesWeek?.filter((t) => Number(t.pnl_r ?? 0) <= -1).length ?? 0;
  const flagsCount = tradesToday?.reduce(
    (acc, trade) => acc + (trade.cumplimiento_flags?.length ?? 0),
    0
  );

  const streakPrev = Number(previousMetrics?.streak_dias_verdes ?? 0);
  const streak = pnlDia > 0 ? streakPrev + 1 : 0;
  const cumplimiento = Math.max(0, 100 - flagsCount * 15);

  const { error: upsertError } = await supabase.from("metrics_daily").upsert(
    {
      user_id: userId,
      fecha: today.toISOString().slice(0, 10),
      pnl_r_dia: pnlDia,
      pnl_r_semana: pnlSemana,
      tp_count: tpCount,
      sl_hits_48h: slHits48h,
      streak_dias_verdes: streak,
      cumplimiento_pct: cumplimiento,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,fecha" }
  );

  if (upsertError) throw upsertError;
}

export async function recomputeAscensoFromTrades(userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: closedTrades, error } = await supabase
    .from("trades")
    .select("pnl_r, close_time")
    .eq("user_id", userId)
    .eq("status", "closed");

  if (error) throw error;

  const trades = closedTrades ?? [];
  const xp = trades.reduce((acc, trade) => acc + (Number(trade.pnl_r ?? 0) > 0 ? 15 : 5), 0);

  const { data: latestMetrics } = await supabase
    .from("metrics_daily")
    .select("streak_dias_verdes")
    .eq("user_id", userId)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  const streak = Number(latestMetrics?.streak_dias_verdes ?? 0);

  const badges: string[] = [];
  if (streak >= 5) badges.push("5 días disciplinados");
  if (streak >= 10) badges.push("10 días verdes");
  if (xp >= 300) badges.push("Impulso en crecimiento");

  const payload = {
    user_id: userId,
    xp,
    level_perfil: calcLevel(xp),
    badges_json: badges,
    streak_cumplimiento: streak,
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await supabase
    .from("gamification_state")
    .upsert(payload, { onConflict: "user_id" });

  if (upsertError) throw upsertError;
}

export async function recomputeTradingSnapshotsAction() {
  const profile = await requireSessionProfile();
  await recomputeMetricsFromTrades(profile.id);
  await recomputeAscensoFromTrades(profile.id);
  await evaluatePlanProgress(profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/ascenso");
  revalidatePath("/plan");
  revalidatePath("/reportes");
}

const MAX_LEVEL = 3;
const MAX_PHASE = 3;

async function evaluatePlanProgress(userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: plan, error: planError } = await supabase
    .from("user_plans")
    .select("id,fase_actual,nivel_actual")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan) return;

  const { data: latestMetrics, error: metricsError } = await supabase
    .from("metrics_daily")
    .select("fecha,cumplimiento_pct,streak_dias_verdes,tp_count")
    .eq("user_id", userId)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (metricsError) throw metricsError;
  if (!latestMetrics) return;

  const now = Date.now();
  const weekAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fortyEightAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);

  const { data: recentTrades, error: tradesError } = await supabase
    .from("trades")
    .select("pnl_r,close_time")
    .eq("user_id", userId)
    .eq("status", "closed")
    .gte("close_time", weekAgoIso);

  if (tradesError) throw tradesError;

  const trades = recentTrades ?? [];
  const tpValidated = trades.filter((trade) => Number(trade.pnl_r ?? 0) >= 1).length;
  const slHits48 = trades.filter((trade) => {
    if (!trade.close_time) return false;
    const closedAt = new Date(trade.close_time);
    return closedAt >= fortyEightAgo && Number(trade.pnl_r ?? 0) <= -1;
  }).length;

  const cumplimiento = Number(latestMetrics.cumplimiento_pct ?? 0);
  const streak = Number(latestMetrics.streak_dias_verdes ?? 0);

  const parsed = parsePhaseLevel(plan.fase_actual, plan.nivel_actual);
  let { phaseNumber, levelNumber } = parsed;
  const previousPhase = phaseNumber;
  const previousLevel = levelNumber;

  const demotion = slHits48 >= 4;
  const promotion = !demotion && cumplimiento >= 85 && (streak >= 10 || tpValidated >= 10);

  if (demotion) {
    levelNumber -= 1;
    if (levelNumber < 1) {
      if (phaseNumber > 1) {
        phaseNumber -= 1;
        levelNumber = MAX_LEVEL;
      } else {
        levelNumber = 1;
      }
    }
  } else if (promotion) {
    levelNumber += 1;
    if (levelNumber > MAX_LEVEL) {
      if (phaseNumber < MAX_PHASE) {
        phaseNumber += 1;
        levelNumber = 1;
      } else {
        levelNumber = MAX_LEVEL;
      }
    }
  }

  if (phaseNumber === previousPhase && levelNumber === previousLevel) {
    return;
  }

  const { error: updateError } = await supabase
    .from("user_plans")
    .update({
      fase_actual: formatPhase(phaseNumber),
      nivel_actual: formatLevel(levelNumber),
      updated_at: new Date().toISOString()
    })
    .eq("id", plan.id);

  if (updateError) throw updateError;

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: demotion ? "plan.demote" : "plan.promote",
    payload: {
      previous_phase: formatPhase(previousPhase),
      previous_level: formatLevel(previousLevel),
      new_phase: formatPhase(phaseNumber),
      new_level: formatLevel(levelNumber),
      cumplimiento,
      streak,
      tp_validated: tpValidated,
      sl_hits_48h: slHits48
    }
  });
}

function calcLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function sum(values: (number | null)[]) {
  return values.reduce((acc, value) => acc + Number(value ?? 0), 0);
}

function parsePhaseLevel(fase: string | null, nivel: string | null) {
  const phaseMatch = fase?.match(/\d+/);
  const levelMatch = nivel?.match(/\d+/);
  const phaseNumber = clampNumber(parseInt(phaseMatch?.[0] ?? "1", 10), 1, MAX_PHASE);
  const levelNumber = clampNumber(parseInt(levelMatch?.[0] ?? "1", 10), 1, MAX_LEVEL);
  return { phaseNumber, levelNumber };
}

function formatPhase(value: number) {
  return `Fase ${value}`;
}

function formatLevel(value: number) {
  return `Nivel ${value}`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
