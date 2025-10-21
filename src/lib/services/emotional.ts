import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EmotionalLog, EmotionalLogsPageData } from "@/lib/dto";

export async function getEmotionalLogsPageData(userId: string): Promise<EmotionalLogsPageData> {
  const supabase = createServerSupabaseClient();

  const [logsRes, todayRes] = await Promise.all([
    supabase
      .from("emotional_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(30),
    supabase
      .from("emotional_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", new Date().toISOString().slice(0, 10))
      .maybeSingle()
  ]);

  if (logsRes.error) throw logsRes.error;
  if (todayRes.error && todayRes.error.code !== "PGRST116") throw todayRes.error;

  const latest = (logsRes.data ?? []).map(mapLog);
  const today = todayRes.data ? mapLog(todayRes.data) : null;

  return { latest, today };
}

function mapLog(row: any): EmotionalLog {
  return {
    id: row.id,
    log_date: row.log_date,
    estado_antes: Number(row.estado_antes ?? 0),
    estado_despues: Number(row.estado_despues ?? 0),
    confianza: Number(row.confianza ?? 0),
    cansancio: Number(row.cansancio ?? 0),
    claridad: Number(row.claridad ?? 0),
    emocion_dominante: row.emocion_dominante,
    reflexion: row.reflexion,
    gratitud: row.gratitud,
    created_at: row.created_at
  };
}
