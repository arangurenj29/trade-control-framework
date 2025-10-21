import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TradesPageData, TradeListItem } from "@/lib/dto";

export async function getTradesPageData(userId: string): Promise<TradesPageData> {
  const supabase = createServerSupabaseClient();

  const [openRes, closedRes] = await Promise.all([
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("open_time", { ascending: false }),
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "closed")
      .order("close_time", { ascending: false })
      .limit(20)
  ]);

  const { data: openTrades, error: openError } = openRes;
  if (openError) throw openError;

  const { data: closedTrades, error: closedError } = closedRes;
  if (closedError) throw closedError;

  const mappedOpen = (openTrades ?? []).map(mapTradeRow);
  const mappedClosed = (closedTrades ?? []).map(mapTradeRow);

  return {
    openTrades: mappedOpen,
    closedTrades: mappedClosed
  };
}

function mapTradeRow(trade: any): TradeListItem {
  return {
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
  };
}
