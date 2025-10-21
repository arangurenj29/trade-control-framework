import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TradesPageData, TradeListItem } from "@/lib/dto";

export async function getTradesPageData(userId: string): Promise<TradesPageData> {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  const todayIso = startOfDay(today).toISOString();
  const weekIso = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const monthIso = startOfMonth(today).toISOString();

  const [openRes, closedRes, balanceRes, dayRes, weekRes, monthRes] = await Promise.all([
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
      .limit(20),
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
      .gte("close_time", todayIso),
    supabase
      .from("trades")
      .select("pnl_monetario")
      .eq("user_id", userId)
      .eq("status", "closed")
      .gte("close_time", weekIso),
    supabase
      .from("trades")
      .select("pnl_monetario")
      .eq("user_id", userId)
      .eq("status", "closed")
      .gte("close_time", monthIso)
  ]);

  const { data: openTrades, error: openError } = openRes;
  if (openError) throw openError;

  const { data: closedTrades, error: closedError } = closedRes;
  if (closedError) throw closedError;

  const { data: balanceData, error: balanceError } = balanceRes;
  if (balanceError) throw balanceError;

  const { data: dayData, error: dayError } = dayRes;
  if (dayError) throw dayError;

  const { data: weekData, error: weekError } = weekRes;
  if (weekError) throw weekError;

  const { data: monthData, error: monthError } = monthRes;
  if (monthError) throw monthError;

  const mappedOpen = (openTrades ?? []).map(mapTradeRow);
  const mappedClosed = (closedTrades ?? []).map(mapTradeRow);

  const sumPnL = (rows: Array<{ pnl_monetario?: number | string | null }> | null | undefined) =>
    (rows ?? []).reduce((acc, row) => acc + Number(row.pnl_monetario ?? 0), 0);

  return {
    openTrades: mappedOpen,
    closedTrades: mappedClosed,
    stats: {
      balance: balanceData?.balance !== undefined ? Number(balanceData.balance) : null,
      equity: balanceData?.equity !== undefined ? Number(balanceData.equity) : null,
      available_balance:
        balanceData?.available_balance !== undefined ? Number(balanceData.available_balance) : null,
      pnl_day: sumPnL(dayData ?? []),
      pnl_week: sumPnL(weekData ?? []),
      pnl_month: sumPnL(monthData ?? [])
    }
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
