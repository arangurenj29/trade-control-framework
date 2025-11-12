import { startOfMonth } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TradesPageData, TradeListItem } from "@/lib/dto";

type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

export async function getTradesPageData(userId: string, options: PaginationOptions = {}): Promise<TradesPageData> {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  const monthIso = startOfMonth(today).toISOString();

  const pageSize = Math.max(1, Math.min(options.pageSize ?? 20, 200));
  const requestedPage = Number.isFinite(options.page ?? NaN) ? Math.max(1, Math.floor(options.page ?? 1)) : 1;
  const offset = (requestedPage - 1) * pageSize;

  const [closedRes, balanceRes, monthRes] = await Promise.all([
    supabase
      .from("trades")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "closed")
      .order("close_time", { ascending: false })
      .range(offset, offset + pageSize - 1),
    supabase
      .from("account_balance_snapshots")
      .select("balance,equity,available_balance")
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("trades")
      .select("pnl_monetario")
      .eq("user_id", userId)
      .eq("status", "closed")
      .gte("close_time", monthIso)
  ]);

  const { data: closedTrades, error: closedError, count } = closedRes;
  if (closedError) throw closedError;

  const { data: balanceData, error: balanceError } = balanceRes;
  if (balanceError) throw balanceError;

  const { data: monthData, error: monthError } = monthRes;
  if (monthError) throw monthError;

  const mappedClosed = (closedTrades ?? []).map(mapTradeRow);
  const totalClosed = count ?? 0;
  const totalPages = totalClosed === 0 ? 1 : Math.max(1, Math.ceil(totalClosed / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const sumPnL = (rows: Array<{ pnl_monetario?: number | string | null }> | null | undefined) =>
    (rows ?? []).reduce((acc, row) => acc + Number(row.pnl_monetario ?? 0), 0);

  let finalClosed = mappedClosed;

  if (currentPage !== requestedPage) {
    const adjustedOffset = (currentPage - 1) * pageSize;
    const { data: adjustedClosed, error: adjustedClosedError } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "closed")
      .order("close_time", { ascending: false })
      .range(adjustedOffset, adjustedOffset + pageSize - 1);

    if (adjustedClosedError) throw adjustedClosedError;
    finalClosed = (adjustedClosed ?? []).map(mapTradeRow);
  }

  return {
    closedTrades: finalClosed,
    stats: {
      balance: balanceData?.balance !== undefined ? Number(balanceData.balance) : null,
      equity: balanceData?.equity !== undefined ? Number(balanceData.equity) : null,
      available_balance:
        balanceData?.available_balance !== undefined ? Number(balanceData.available_balance) : null,
      pnl_month: sumPnL(monthData ?? [])
    },
    pagination: {
      page: currentPage,
      pageSize,
      total: totalClosed
    }
  };
}

function mapTradeRow(trade: any): TradeListItem {
  const pnlMonetario =
    trade.pnl_monetario !== null && trade.pnl_monetario !== undefined
      ? Number(trade.pnl_monetario)
      : null;
  const riskMonetario =
    trade.risk_monetario !== null && trade.risk_monetario !== undefined
      ? Number(trade.risk_monetario)
      : null;

  const entryPrice = Number(trade.entry);
  const slPrice = Number(trade.sl);
  const leverage = Number(trade.leverage);
  const sizeNominalRaw = Number(trade.size_nominal);
  const sizeNominal = Number.isFinite(sizeNominalRaw) ? Math.abs(sizeNominalRaw) : 0;
  const riskEnR = Number(trade.risk_en_r);

  const quantityValue =
    trade.quantity !== null && trade.quantity !== undefined ? Number(trade.quantity) : null;
  let normalizedQuantity = quantityValue !== null && Number.isFinite(quantityValue) ? quantityValue : null;
  if (
    (normalizedQuantity === null || normalizedQuantity === 0) &&
    sizeNominal > 0 &&
    entryPrice !== 0 &&
    Number.isFinite(entryPrice)
  ) {
    const derivedQty = sizeNominal / Math.abs(entryPrice);
    if (Number.isFinite(derivedQty) && derivedQty > 0) {
      normalizedQuantity = Number(derivedQty.toFixed(6));
    }
  }

  let exitPrice =
    trade.exit_price !== null && trade.exit_price !== undefined
      ? Number(trade.exit_price)
      : null;
  if (exitPrice !== null && !Number.isFinite(exitPrice)) {
    exitPrice = null;
  }

  let closeVolumeExplicit =
    trade.close_volume !== null && trade.close_volume !== undefined
      ? Number(trade.close_volume)
      : null;
  if (closeVolumeExplicit !== null && !Number.isFinite(closeVolumeExplicit)) {
    closeVolumeExplicit = null;
  }

  if (
    (exitPrice === null || Number.isNaN(exitPrice)) &&
    pnlMonetario !== null &&
    normalizedQuantity !== null &&
    normalizedQuantity !== 0 &&
    Number.isFinite(entryPrice)
  ) {
    const derivedExit = entryPrice + pnlMonetario / normalizedQuantity;
    if (Number.isFinite(derivedExit)) {
      exitPrice = derivedExit;
    }
  }

  if (
    (normalizedQuantity === null || normalizedQuantity === 0) &&
    sizeNominal > 0 &&
    exitPrice !== null &&
    exitPrice !== 0 &&
    Number.isFinite(exitPrice)
  ) {
    const qtyFromExit = sizeNominal / Math.abs(exitPrice);
    if (Number.isFinite(qtyFromExit) && qtyFromExit > 0) {
      normalizedQuantity = Number(qtyFromExit.toFixed(6));
    }
  }

  let computedCloseVolume = closeVolumeExplicit;
  if (
    (computedCloseVolume === null || Number.isNaN(computedCloseVolume)) &&
    exitPrice !== null &&
    normalizedQuantity !== null &&
    Number.isFinite(exitPrice) &&
    Number.isFinite(normalizedQuantity)
  ) {
    const derivedVolume = Math.abs(exitPrice) * Math.abs(normalizedQuantity);
    if (Number.isFinite(derivedVolume)) {
      computedCloseVolume = derivedVolume;
    }
  }

  const storedPnlR = trade.pnl_r !== null && trade.pnl_r !== undefined ? Number(trade.pnl_r) : null;
  const derivedPnlR =
    pnlMonetario !== null && riskMonetario !== null && riskMonetario !== 0
      ? Number((pnlMonetario / riskMonetario).toFixed(2))
      : storedPnlR;

  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    type: trade.type,
    exchange: trade.exchange,
    entry: entryPrice,
    sl: slPrice,
    leverage,
    size_nominal: sizeNominal,
    quantity: normalizedQuantity !== null && Number.isFinite(normalizedQuantity)
      ? Number(normalizedQuantity.toFixed(6))
      : null,
    exit_price:
      exitPrice !== null && Number.isFinite(exitPrice) ? Number(exitPrice.toFixed(4)) : null,
    close_volume:
      computedCloseVolume !== null && Number.isFinite(computedCloseVolume)
        ? Number(computedCloseVolume.toFixed(2))
        : null,
    risk_en_r: riskEnR,
    risk_monetario: riskMonetario,
    status: trade.status,
    open_time: trade.open_time,
    close_time: trade.close_time,
    pnl_r: derivedPnlR,
    pnl_monetario: pnlMonetario,
    cumplimiento_flags: trade.cumplimiento_flags ?? []
  };
}
