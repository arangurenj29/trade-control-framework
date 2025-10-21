import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BybitClosedPnl } from "@/lib/services/bybit";

type RawBybitTrade = {
  exec_id: string;
  order_id: string | null;
  payload: Record<string, any>;
  traded_at: string;
};

type AggregatedTrade = {
  user_id: string;
  symbol: string;
  side: "long" | "short";
  type: "perp";
  exchange: string;
  entry: number;
  sl: number;
  leverage: number;
  size_nominal: number;
  quantity: number | null;
  exit_price: number | null;
  close_volume: number | null;
  risk_monetario: number;
  risk_en_r: number;
  open_time: string;
  close_time: string | null;
  pnl_monetario: number | null;
  pnl_r: number | null;
  cumplimiento_flags: string[];
  status: "open" | "closed";
  external_id: string;
  tp_json: null;
  updated_at: string;
};

function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function detectStatus(group: RawBybitTrade[]): "open" | "closed" {
  const hasClosure = group.some((item) => {
    const payload = item.payload ?? {};
    const closedPnl = parseNumber(payload.closedPnl);
    const closedSize = parseNumber(payload.closedSize);
    const execType = String(payload.execType ?? "").toLowerCase();
    return closedPnl !== 0 || closedSize !== 0 || execType.includes("close");
  });

  return hasClosure ? "closed" : "open";
}

function computeStopLoss(price: number, riskMonetario: number, qty: number, side: "long" | "short") {
  if (price <= 0 || riskMonetario <= 0 || qty <= 0) return price;
  const riskPerUnit = riskMonetario / qty;
  if (!Number.isFinite(riskPerUnit)) return price;
  if (side === "long") {
    return Math.max(price - riskPerUnit, 0);
  }
  return price + riskPerUnit;
}

function aggregateGroup(
  userId: string,
  externalId: string,
  group: RawBybitTrade[],
  riskMonetario: number,
  planStartMs: number | null
): AggregatedTrade | null {
  if (group.length === 0) return null;

  const payloadSample = group[0]?.payload ?? {};
  const symbol = String(payloadSample.symbol ?? group[0]?.payload?.symbol ?? "");
  if (!symbol) return null;

  const side = String(payloadSample.side ?? "").toLowerCase() === "sell" ? "short" : "long";
  const leverage = parseNumber(payloadSample.leverage) || 1;

  const totalQtyAbs = group.reduce((sum, item) => sum + Math.abs(parseNumber(item.payload?.execQty)), 0);
  const totalNotional = group.reduce(
    (sum, item) =>
      sum + Math.abs(parseNumber(item.payload?.execPrice) * parseNumber(item.payload?.execQty)),
    0
  );
  const rawOpenNotional = group.reduce(
    (sum, item) => sum + Math.abs(parseNumber(item.payload?.execValue)),
    0
  );

  const closedQty = group.reduce((sum, item) => sum + Math.abs(parseNumber(item.payload?.closedSize)), 0);
  const quantityMagnitude = closedQty > 0 ? closedQty : totalQtyAbs;
  const entryPrice =
    quantityMagnitude > 0 ? totalNotional / quantityMagnitude : parseNumber(payloadSample.execPrice);
  const signedQuantity =
    quantityMagnitude === 0 ? 0 : side === "short" ? -quantityMagnitude : quantityMagnitude;
  const openNotional =
    rawOpenNotional > 0
      ? rawOpenNotional
      : quantityMagnitude > 0
        ? Math.abs(entryPrice) * quantityMagnitude
        : 0;

  const closeNotionalFromClosedSize = group.reduce((sum, item) => {
    const closedSize = Math.abs(parseNumber(item.payload?.closedSize));
    if (closedSize > 0) {
      const execPrice = Math.abs(parseNumber(item.payload?.execPrice));
      if (execPrice > 0) {
        return sum + execPrice * closedSize;
      }
    }
    return sum;
  }, 0);

  const closeNotionalFromExecType = group.reduce((sum, item) => {
    const execType = String(item.payload?.execType ?? "").toLowerCase();
    if (execType.includes("close")) {
      const execQty = Math.abs(parseNumber(item.payload?.execQty));
      const execPrice = Math.abs(parseNumber(item.payload?.execPrice));
      if (execQty > 0 && execPrice > 0) {
        return sum + execQty * execPrice;
      }
    }
    return sum;
  }, 0);

  let exitPrice: number | null =
    quantityMagnitude > 0 && closeNotionalFromClosedSize > 0
      ? closeNotionalFromClosedSize / quantityMagnitude
      : quantityMagnitude > 0 && closeNotionalFromExecType > 0
        ? closeNotionalFromExecType / quantityMagnitude
        : null;

  let pnlMonetario = group.reduce((sum, item) => sum + parseNumber(item.payload?.closedPnl), 0);
  const totalFees = group.reduce(
    (sum, item) => sum + parseNumber(item.payload?.execFee ?? item.payload?.execFeeV2),
    0
  );

  if ((pnlMonetario === 0 || !Number.isFinite(pnlMonetario)) && exitPrice !== null && Number.isFinite(exitPrice)) {
    const gross = (exitPrice - entryPrice) * signedQuantity;
    pnlMonetario = Number((gross - totalFees).toFixed(8));
  }

  const pnlR =
    riskMonetario > 0 ? Number((pnlMonetario / riskMonetario).toFixed(2)) : (pnlMonetario !== 0 ? 0 : null);

  const status = detectStatus(group);
  const openTimeMs = group.reduce(
    (min, item) => Math.min(min, new Date(item.traded_at).getTime()),
    new Date(group[0]!.traded_at).getTime()
  );
  const closeTimeMs =
    status === "closed"
      ? group.reduce(
          (max, item) => Math.max(max, new Date(item.traded_at).getTime()),
          new Date(group[0]!.traded_at).getTime()
        )
      : null;

  const sl = computeStopLoss(entryPrice, riskMonetario, quantityMagnitude, side);

  if (planStartMs !== null && openTimeMs < planStartMs) {
    return null;
  }

  if (status !== "closed") {
    return null;
  }

  if ((exitPrice === null || !Number.isFinite(exitPrice)) && signedQuantity !== 0) {
    const derived = entryPrice + pnlMonetario / signedQuantity;
    if (Number.isFinite(derived)) {
      exitPrice = derived;
    }
  }

  const closeVolume =
    exitPrice !== null && Number.isFinite(exitPrice) && quantityMagnitude > 0
      ? Math.abs(exitPrice) * quantityMagnitude
      : null;

  return {
    user_id: userId,
    symbol,
    side,
    type: "perp",
    exchange: "Bybit",
    entry: Number(entryPrice.toFixed(4)),
    sl: Number(sl.toFixed(4)),
    leverage,
    size_nominal: Number(openNotional.toFixed(2)),
    quantity: Number(signedQuantity.toFixed(6)),
    exit_price:
      exitPrice !== null && Number.isFinite(exitPrice) ? Number(exitPrice.toFixed(4)) : null,
    close_volume:
      closeVolume !== null && Number.isFinite(closeVolume) ? Number(closeVolume.toFixed(2)) : null,
    risk_monetario: Number(riskMonetario.toFixed(2)),
    risk_en_r: riskMonetario > 0 ? 1 : 0,
    open_time: new Date(openTimeMs).toISOString(),
    close_time: closeTimeMs ? new Date(closeTimeMs).toISOString() : null,
    pnl_monetario: Number(pnlMonetario.toFixed(2)),
    pnl_r: pnlR,
    cumplimiento_flags: [],
    status,
    external_id: externalId,
    tp_json: null,
    updated_at: new Date().toISOString()
  };
}

export async function ingestBybitTrades(userId: string, planStart: Date | null) {
  const supabase = createServerSupabaseClient();

  const [{ data: rawTrades, error: rawError }, { data: plan }] = await Promise.all([
    supabase
      .from("bybit_raw_trades")
      .select("exec_id,order_id,payload,traded_at")
      .eq("user_id", userId),
    supabase
      .from("user_plans")
      .select("patrimonio,r_pct,effective_from")
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (rawError) throw rawError;
  if (!rawTrades || rawTrades.length === 0) {
    return { upserts: 0 };
  }

  const planStartMs = planStart
    ? planStart.getTime()
    : plan?.effective_from
      ? new Date(plan.effective_from).getTime()
      : null;
  const planStartIso = planStartMs !== null ? new Date(planStartMs).toISOString() : null;

  const riskMonetario =
    plan && plan.patrimonio && plan.r_pct
      ? Number(plan.patrimonio) * (Number(plan.r_pct) / 100)
      : 0;

  const grouped = new Map<string, RawBybitTrade[]>();
  for (const item of rawTrades) {
    const key = item.order_id ?? item.exec_id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item as RawBybitTrade);
  }

  const upsertPayload: AggregatedTrade[] = [];
  for (const [externalId, group] of grouped.entries()) {
    const aggregated = aggregateGroup(userId, externalId, group, riskMonetario, planStartMs);
    if (aggregated) {
      upsertPayload.push(aggregated);
    }
  }

  if (upsertPayload.length === 0) {
    return { upserts: 0 };
  }

  if (planStartIso) {
    const { error: deleteError } = await supabase
      .from("trades")
      .delete()
      .eq("user_id", userId)
      .lt("open_time", planStartIso)
      .not("external_id", "is", null);

    if (deleteError) throw deleteError;
  }

  const chunkSize = 200;
  for (let index = 0; index < upsertPayload.length; index += chunkSize) {
    const chunk = upsertPayload.slice(index, index + chunkSize);
    const { error: upsertError } = await supabase
      .from("trades")
      .upsert(chunk, { onConflict: "user_id,external_id" });

    if (upsertError) throw upsertError;
  }

  return { upserts: upsertPayload.length };
}

export async function ingestBybitClosedPnl(userId: string, pnl: BybitClosedPnl[]) {
  if (pnl.length === 0) {
    return { upserts: 0 };
  }

  const supabase = createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("user_plans")
    .select("patrimonio,r_pct")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const riskMonetario = plan
    ? Number(plan.patrimonio ?? 0) * (Number(plan.r_pct ?? 0) / 100)
    : 0;

  const [{ error: clearTradesError }, { error: clearHistoryError }] = await Promise.all([
    supabase
      .from("trades")
      .delete()
      .eq("user_id", userId)
      .not("external_id", "is", null),
    supabase.from("bybit_pnl_history").delete().eq("user_id", userId)
  ]);

  if (clearTradesError) throw clearTradesError;
  if (clearHistoryError) throw clearHistoryError;

  const tradesPayload = pnl.map((item) => {
    let entryPrice = Number(item.avgEntryPrice ?? item.avg_exit_price ?? 0);
    let exitPrice = Number(item.avgExitPrice ?? item.avg_exit_price ?? 0);
    const rawQty = Number(item.qty ?? item.size ?? item.closedSize ?? 0);
    const pnlMonetario = Number(item.realisedPnl ?? item.closedPnl ?? 0);
    const closedAt = Number(
      item.closedTime ?? item.updatedTime ?? item.createdTime ?? 0
    );
    const createdAt = Number(item.createdTime ?? item.closedTime ?? item.updatedTime ?? 0);

    const openTimeIso = new Date(createdAt).toISOString();
    const closeTimeIso = new Date(closedAt).toISOString();
    const quantityAbs = Math.abs(rawQty);
    const side = String(item.side ?? "Buy").toLowerCase() === "sell" ? "short" : "long";
    const signedQty = quantityAbs === 0 ? 0 : side === "short" ? -quantityAbs : quantityAbs;

    if (!Number.isFinite(entryPrice) || entryPrice === 0) {
      entryPrice = exitPrice || entryPrice;
    }

    if ((!Number.isFinite(exitPrice) || exitPrice === 0) && signedQty !== 0) {
      const derivedExit = entryPrice + pnlMonetario / signedQty;
      if (Number.isFinite(derivedExit)) {
        exitPrice = derivedExit;
      }
    }

    const basePrice = entryPrice || exitPrice;
    const sizeNominal = quantityAbs * Math.abs(basePrice);
    const closeVolume =
      Number.isFinite(exitPrice) && exitPrice !== 0 ? quantityAbs * Math.abs(exitPrice) : null;

    const pnlR = riskMonetario > 0 ? Number((pnlMonetario / riskMonetario).toFixed(2)) : null;
    return {
      user_id: userId,
      symbol: item.symbol,
      side,
      type: "perp" as const,
      exchange: "Bybit",
      entry: entryPrice || exitPrice,
      sl: 0,
      leverage: Number(item.leverage ?? 1),
      size_nominal: Number(sizeNominal.toFixed(2)),
      quantity: Number(signedQty.toFixed(6)),
      exit_price:
        Number.isFinite(exitPrice) && exitPrice !== 0 ? Number(exitPrice.toFixed(4)) : null,
      close_volume: closeVolume !== null ? Number(closeVolume.toFixed(2)) : null,
      risk_monetario: Number(riskMonetario.toFixed(2)),
      risk_en_r: riskMonetario > 0 ? 1 : 0,
      open_time: openTimeIso,
      close_time: closeTimeIso,
      pnl_monetario: Number(pnlMonetario.toFixed(2)),
      pnl_r: pnlR,
      cumplimiento_flags: [],
      status: "closed" as const,
      external_id: item.orderId,
      tp_json: null,
      updated_at: new Date().toISOString()
    };
  });

  const chunkSize = 200;
  for (let index = 0; index < pnl.length; index += chunkSize) {
    const chunk = pnl.slice(index, index + chunkSize).map((item) => ({
      user_id: userId,
      order_id: item.orderId,
      symbol: item.symbol,
      side: item.side ?? null,
      qty: Number(item.qty ?? item.size ?? 0),
      realised_pnl: Number(item.realisedPnl ?? item.closedPnl ?? 0),
      fee: Number(item.commission ?? 0),
      avg_entry_price: Number(item.avgEntryPrice ?? 0),
      avg_exit_price: Number(item.avgExitPrice ?? 0),
      closed_size: Number(item.closedSize ?? 0),
      leverage: Number(item.leverage ?? 1),
      closed_at: new Date(Number(item.closedTime ?? 0)).toISOString(),
      raw: item,
      created_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabase
      .from("bybit_pnl_history")
      .upsert(chunk, { onConflict: "user_id,order_id,closed_at" });

    if (upsertError) throw upsertError;
  }

  for (let index = 0; index < tradesPayload.length; index += chunkSize) {
    const chunk = tradesPayload.slice(index, index + chunkSize);
    const { error: upsertTradeError } = await supabase
      .from("trades")
      .upsert(chunk, { onConflict: "user_id,external_id" });

    if (upsertTradeError) throw upsertTradeError;
  }

  return { upserts: tradesPayload.length };
}

export async function ingestBybitExecutions(
  userId: string,
  executions: import("@/lib/services/bybit").BybitExecution[],
  planStart: Date | null
) {
  if (executions.length === 0) {
    return { upserts: 0 };
  }

  const supabase = createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("user_plans")
    .select("patrimonio,r_pct")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const planStartMs = planStart ? planStart.getTime() : null;
  const riskMonetario = plan
    ? Number(plan.patrimonio ?? 0) * (Number(plan.r_pct ?? 0) / 100)
    : 0;

  const grouped = new Map<string, RawBybitTrade[]>();
  for (const execution of executions) {
    const tradedAt = new Date(Number(execution.execTime)).toISOString();
    const orderId = execution.orderId ?? execution.execId;
    if (!grouped.has(orderId)) {
      grouped.set(orderId, []);
    }
    const row: RawBybitTrade = {
      exec_id: execution.execId,
      order_id: execution.orderId ?? execution.execId,
      payload: execution as unknown as Record<string, any>,
      traded_at: tradedAt
    };
    grouped.get(orderId)!.push(row);
  }

  const upsertPayload: AggregatedTrade[] = [];
  for (const [externalId, group] of grouped.entries()) {
    const aggregated = aggregateGroup(userId, externalId, group, riskMonetario, planStartMs);
    if (aggregated) {
      upsertPayload.push(aggregated);
    }
  }

  if (upsertPayload.length === 0) {
    return { upserts: 0 };
  }

  const chunkSize = 200;
  for (let index = 0; index < upsertPayload.length; index += chunkSize) {
    const chunk = upsertPayload.slice(index, index + chunkSize);
    const { error: upsertTradeError } = await supabase
      .from("trades")
      .upsert(chunk, { onConflict: "user_id,external_id" });

    if (upsertTradeError) throw upsertTradeError;
  }

  return { upserts: upsertPayload.length };
}
