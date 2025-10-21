"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import {
  fetchClosedPnlWindow,
  fetchWalletBalance,
  fetchExecutionsWindow
} from "@/lib/services/bybit";
import { ingestBybitClosedPnl, ingestBybitExecutions } from "@/lib/services/bybit-transform";
import { recomputeAscensoFromTrades, recomputeMetricsFromTrades } from "@/lib/actions/trade";
import { logDebug } from "@/lib/logger";

export type BybitConnectionActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const REVALIDATE_PATH = "/integraciones";

export async function upsertBybitConnectionAction(
  _prevState: BybitConnectionActionState,
  formData: FormData
): Promise<BybitConnectionActionState> {
  const profile = await requireSessionProfile();
  const supabase = createServerSupabaseClient();

  const apiKey = formData.get("api_key");
  const apiSecret = formData.get("api_secret");

  try {
    const trimmedKey = typeof apiKey === "string" ? apiKey.trim() : "";
    const trimmedSecret = typeof apiSecret === "string" ? apiSecret.trim() : "";

    const { data: existing, error: fetchError } = await supabase
      .from("bybit_connections")
      .select("api_key_cipher,api_secret_cipher")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing && (!trimmedKey || !trimmedSecret)) {
      return {
        status: "error",
        message: "Debes ingresar API key y API secret para crear la conexión."
      };
    }

    const encryptedKey = trimmedKey
      ? encryptSecret(trimmedKey)
      : existing?.api_key_cipher;

    const encryptedSecret = trimmedSecret
      ? encryptSecret(trimmedSecret)
      : existing?.api_secret_cipher;

    if (!encryptedKey || !encryptedSecret) {
      return {
        status: "error",
        message: "No se encontraron credenciales previas. Vuelve a ingresar API key y secret."
      };
    }

    const { error } = await supabase
      .from("bybit_connections")
      .upsert(
        {
          user_id: profile.id,
          api_key_cipher: encryptedKey,
          api_secret_cipher: encryptedSecret,
          status: "active",
          last_error: null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "bybit.connection_saved"
    });

    revalidatePath(REVALIDATE_PATH);
    return { status: "success", message: "Conexión con Bybit guardada y activada." };
  } catch (error) {
    return {
      status: "error",
      message: (error as Error).message ?? "Error guardando la conexión."
    };
  }
}

export async function pauseBybitConnectionAction() {
  const profile = await requireSessionProfile();
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("bybit_connections")
    .update({
      status: "paused",
      updated_at: new Date().toISOString()
    })
    .eq("user_id", profile.id);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: profile.id,
    action: "bybit.connection_paused"
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function resumeBybitConnectionAction() {
  const profile = await requireSessionProfile();
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("bybit_connections")
    .update({
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("user_id", profile.id);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: profile.id,
    action: "bybit.connection_resumed"
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deleteBybitConnectionAction() {
  const profile = await requireSessionProfile();
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("bybit_connections")
    .delete()
    .eq("user_id", profile.id);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: profile.id,
    action: "bybit.connection_deleted"
  });

  revalidatePath(REVALIDATE_PATH);
}

export type SyncBybitActionState =
  | { status: "idle" }
  | { status: "success"; message: string; synced: number; trades: number }
  | { status: "error"; message: string };

export async function syncBybitTradesAction(): Promise<SyncBybitActionState> {
  const profile = await requireSessionProfile();
  const supabase = createServerSupabaseClient();

  const { data: connection, error } = await supabase
    .from("bybit_connections")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (error) throw error;
  if (!connection) {
    return {
      status: "error",
      message: "Configura tu conexión con Bybit antes de sincronizar."
    };
  }

  if (connection.status !== "active") {
    return {
      status: "error",
      message: "La conexión está en pausa. Actívala para sincronizar."
    };
  }

  try {
    const apiKey = decryptSecret(connection.api_key_cipher);
    const apiSecret = decryptSecret(connection.api_secret_cipher);
    const now = Date.now();

    const { data: plan, error: planError } = await supabase
      .from("user_plans")
      .select("effective_from")
      .eq("user_id", profile.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) throw planError;

    const planStart = plan?.effective_from ? new Date(plan.effective_from) : null;
    const planStartMs = planStart ? planStart.getTime() : null;

    const lastSynced = connection.last_synced_at ? new Date(connection.last_synced_at).getTime() : null;
    const lookbackWindow = env.bybitSyncDays * 86_400_000;
    const baseStart = planStartMs ? planStartMs : now - lookbackWindow;

    let startTime: number;
    if (lastSynced) {
      const retryWindow = Math.min(lastSynced - 10 * 60 * 1000, now - lookbackWindow);
      startTime = Math.max(baseStart, retryWindow);
    } else {
      startTime = baseStart;
    }

    if (planStartMs) {
      startTime = Math.max(startTime, planStartMs);
    }

    await logDebug("bybit.sync:start", {
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(now).toISOString(),
      plan_start: planStart?.toISOString() ?? null,
      window_days: env.bybitSyncDays
    });

    let closedPnl: Awaited<ReturnType<typeof fetchClosedPnlWindow>> | null = null;
    let fallbackExecutions: Awaited<ReturnType<typeof fetchExecutionsWindow>> | null = null;

    try {
      closedPnl = await fetchClosedPnlWindow({
        apiKey,
        apiSecret,
        startTime,
        endTime: now
      });
    } catch (error) {
      const message = (error as Error).message ?? "Unknown error";
      await logDebug("bybit.sync:closed_pnl_failed", { message });

      if (message.includes("404")) {
        fallbackExecutions = await fetchExecutionsWindow({
          apiKey,
          apiSecret,
          startTime,
          endTime: now
        });
      } else {
        throw error;
      }
    }

    if (closedPnl) {
      await logDebug("bybit.sync:received", {
        count: closedPnl.length,
        sample: closedPnl.slice(0, Math.min(3, closedPnl.length))
      });
    }
    if (fallbackExecutions) {
      await logDebug("bybit.sync:received_fallback", {
        count: fallbackExecutions.length,
        sample: fallbackExecutions.slice(0, Math.min(3, fallbackExecutions.length))
      });
    }

    if ((closedPnl && closedPnl.length === 0) || (!closedPnl && (!fallbackExecutions || fallbackExecutions.length === 0))) {
      revalidatePath(REVALIDATE_PATH);
      return {
        status: "success",
        message: "No se encontraron operaciones cerradas en la ventana consultada.",
        synced: 0,
        trades: 0
      };
    }

    let upserts = 0;

    if (closedPnl) {
      const ingestResult = await ingestBybitClosedPnl(profile.id, closedPnl);
      upserts = ingestResult.upserts;
    } else if (fallbackExecutions) {
      const ingestResult = await ingestBybitExecutions(profile.id, fallbackExecutions, planStart);
      upserts = ingestResult.upserts;
    }
    await recomputeMetricsFromTrades(profile.id);
    await recomputeAscensoFromTrades(profile.id);

    const balance = await fetchWalletBalance({ apiKey, apiSecret });
    if (balance) {
      await supabase.from("account_balance_snapshots").insert({
        user_id: profile.id,
        balance: balance.balance,
        equity: balance.equity,
        available_balance: balance.available_balance,
        captured_at: new Date(now).toISOString()
      });
    }

    await supabase
      .from("bybit_connections")
      .update({
        last_synced_at: new Date(now).toISOString(),
        last_error: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", connection.id);

    const fillsCount = closedPnl ? closedPnl.length : fallbackExecutions?.length ?? 0;

    await logDebug("bybit.sync:consolidated", {
      source: closedPnl ? "closed_pnl" : "executions",
      fills: fillsCount,
      consolidated_trades: upserts
    });

    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "bybit.sync",
      payload: {
        fills: fillsCount,
        trades: upserts,
        start_time: startTime,
        end_time: now,
        source: closedPnl ? "closed_pnl" : "executions"
      }
    });

    revalidatePath(REVALIDATE_PATH);
    revalidatePath("/dashboard");
    revalidatePath("/trades");
    revalidatePath("/ascenso");
    revalidatePath("/plan");
    revalidatePath("/reportes");
    const syncedFills = closedPnl ? closedPnl.length : fallbackExecutions?.length ?? 0;

    return {
      status: "success",
      message: `Se procesaron ${syncedFills} fills (resultado: ${upserts} trades consolidados).`,
      synced: syncedFills,
      trades: upserts
    };
  } catch (error) {
    const message = (error as Error).message ?? "Error sincronizando trades.";
    await supabase
      .from("bybit_connections")
      .update({
        last_error: message,
        updated_at: new Date().toISOString()
      })
      .eq("id", connection.id);

    await logDebug("bybit.sync:error", { message });

    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "bybit.sync_failed",
      payload: { message }
    });

    revalidatePath(REVALIDATE_PATH);
    return { status: "error", message };
  }
}
