import { startOfWeek, endOfWeek } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AscensoPageData, Mission } from "@/lib/dto";

export async function getAscensoData(userId: string): Promise<AscensoPageData> {
  const supabase = createServerSupabaseClient();
  const { data: summary, error } = await supabase
    .from("gamification_state")
    .select("xp,level_perfil,badges_json,streak_cumplimiento")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const missions = await buildMissions(userId, summary?.streak_cumplimiento ?? 0);

  return {
    summary: summary
      ? {
          xp: summary.xp,
          level_perfil: summary.level_perfil,
          badges: (summary.badges_json as string[]) ?? [],
          streak_cumplimiento: summary.streak_cumplimiento
        }
      : null,
    missions
  };
}

async function buildMissions(userId: string, streak: number): Promise<Mission[]> {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  const startWeek = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const endWeek = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

  const { data: tradesWeek, error } = await supabase
    .from("trades")
    .select("pnl_r")
    .eq("user_id", userId)
    .eq("status", "closed")
    .gte("close_time", startWeek)
    .lte("close_time", endWeek);

  if (error) throw error;

  const positiveTrades = tradesWeek?.filter((trade) => Number(trade.pnl_r ?? 0) > 0).length ?? 0;

  return [
    {
      id: "streak-5",
      title: "Mantén 5 días de streak",
      description: "Cierra 5 días consecutivos con PnL positivo.",
      progress: streak,
      target: 5,
      reward_xp: 50
    },
    {
      id: "tp-boost",
      title: "Tres TPs esta semana",
      description: "Consigue tres trades positivos durante la semana actual.",
      progress: positiveTrades,
      target: 3,
      reward_xp: 35
    }
  ];
}
