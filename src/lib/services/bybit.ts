import { createHmac } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logDebug } from "@/lib/logger";

const BASE_URL = process.env.BYBIT_REST_URL ?? "https://api.bybit.com";
const CATEGORY = "linear";
const PAGE_LIMIT = 200;
const DEFAULT_RECV_WINDOW = "5000";

export type BybitExecution = {
  execId: string;
  orderId: string;
  symbol: string;
  side: "Buy" | "Sell";
  execPrice: string;
  execQty: string;
  execValue: string;
  execTime: string;
  execType: string;
  closedPnl?: string;
  closedSize?: string;
};

type FetchExecutionsOptions = {
  apiKey: string;
  apiSecret: string;
  startTime: number;
  endTime: number;
  cursor?: string;
};

type FetchExecutionsResponse = {
  executions: BybitExecution[];
  nextCursor: string | null;
  windowEnd: number;
};

function createSignature({
  apiKey,
  apiSecret,
  timestamp,
  recvWindow,
  query
}: {
  apiKey: string;
  apiSecret: string;
  timestamp: string;
  recvWindow: string;
  query: string;
}) {
  const payload = `${timestamp}${apiKey}${recvWindow}${query}`;
  return createHmac("sha256", apiSecret).update(payload).digest("hex");
}

async function fetchExecutionsPage({
  apiKey,
  apiSecret,
  startTime,
  endTime,
  cursor
}: FetchExecutionsOptions): Promise<FetchExecutionsResponse> {
  // Bybit sólo permite 7 días por llamada.
  const MAX_RANGE = 7 * 24 * 60 * 60 * 1000;
  const windowEnd = Math.min(endTime, startTime + MAX_RANGE);

  const params = new URLSearchParams({
    category: CATEGORY,
    limit: PAGE_LIMIT.toString(),
    startTime: Math.floor(startTime).toString(),
    endTime: Math.floor(windowEnd).toString()
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const query = params.toString();
  const timestamp = Date.now().toString();
  const recvWindow = DEFAULT_RECV_WINDOW;

  const signature = createSignature({
    apiKey,
    apiSecret,
    timestamp,
    recvWindow,
    query
  });

  await logDebug("bybit.api:request", {
    path: "/v5/execution/list",
    query,
    cursor: cursor ?? null,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(windowEnd).toISOString()
  });

  const response = await fetch(`${BASE_URL}/v5/execution/list?${query}`, {
    method: "GET",
    headers: {
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-SIGN": signature,
      "X-BAPI-SIGN-TYPE": "2",
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow
    }
  });

  if (!response.ok) {
    const bodyText = await response.text();
    await logDebug("bybit.api:error", {
      status: response.status,
      statusText: response.statusText,
      body: bodyText
    });
    throw new Error(`Bybit API error (${response.status}): ${bodyText}`);
  }

  const payload = (await response.json()) as {
    retCode: number;
    retMsg: string;
    result?: {
      list?: BybitExecution[];
      nextPageCursor?: string;
    };
  };

  if (payload.retCode !== 0) {
    logDebug("bybit.api:response_error", payload);
    throw new Error(`Bybit API error: ${payload.retMsg}`);
  }

  await logDebug("bybit.api:response", {
    count: payload.result?.list?.length ?? 0,
    nextCursor: payload.result?.nextPageCursor ?? null,
    sample: payload.result?.list ? payload.result.list.slice(0, 2) : []
  });

  return {
    executions: payload.result?.list ?? [],
    nextCursor: payload.result?.nextPageCursor ?? null,
    windowEnd
  };
}

export async function fetchExecutionsWindow(options: {
  apiKey: string;
  apiSecret: string;
  startTime: number;
  endTime: number;
}) {
  const dedupe = new Set<string>();
  const results: BybitExecution[] = [];

  let cursor: string | undefined;
  let currentStart = options.startTime;

  do {
    const pageEnd = Math.min(options.endTime, currentStart + 7 * 24 * 60 * 60 * 1000);

    const { executions, nextCursor, windowEnd } = await fetchExecutionsPage({
      ...options,
      startTime: currentStart,
      endTime: pageEnd,
      cursor
    });

    for (const execution of executions) {
      if (!dedupe.has(execution.execId)) {
        dedupe.add(execution.execId);
        results.push(execution);
      }
    }

    cursor = nextCursor ?? undefined;
    if (!cursor) {
      currentStart = windowEnd;
    }
  } while (cursor || currentStart < options.endTime);

  return results;
}

export async function getBybitConnection(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("bybit_connections")
    .select("id,status,last_synced_at,last_error,created_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function countRawBybitTrades(userId: string) {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("bybit_raw_trades")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function countBybitClosedPnl(userId: string) {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("bybit_pnl_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function countProcessedTrades(userId: string) {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("trades")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("external_id", "is", null);

  if (error) throw error;
  return count ?? 0;
}

// Closed PnL
const PNL_PAGE_LIMIT = 200;

export type BybitClosedPnl = {
  orderId: string;
  symbol: string;
  side: "Buy" | "Sell" | string;
  qty: string;
  size: string;
  realisedPnl: string;
  commission: string;
  funding: string;
  avgEntryPrice: string;
  avgExitPrice: string;
  closedPnl: string;
  closedSize: string;
  leverage: string;
  createdTime: string;
  closedTime: string;
};

async function fetchClosedPnlPage({
  apiKey,
  apiSecret,
  startTime,
  endTime,
  cursor
}: FetchExecutionsOptions): Promise<{ items: BybitClosedPnl[]; nextCursor: string | null; windowEnd: number }> {
  const MAX_RANGE = 7 * 24 * 60 * 60 * 1000;
  const windowEnd = Math.min(endTime, startTime + MAX_RANGE);

  const params = new URLSearchParams({
    category: CATEGORY,
    limit: PNL_PAGE_LIMIT.toString(),
    startTime: Math.floor(startTime).toString(),
    endTime: Math.floor(windowEnd).toString()
  });

  if (cursor) params.set("cursor", cursor);

  const query = params.toString();
  const timestamp = Date.now().toString();
  const recvWindow = DEFAULT_RECV_WINDOW;
  const signature = createSignature({ apiKey, apiSecret, timestamp, recvWindow, query });

  await logDebug("bybit.api:request", {
    path: "/v5/position/closed-pnl",
    query,
    cursor: cursor ?? null,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(windowEnd).toISOString()
  });

  const response = await fetch(`${BASE_URL}/v5/position/closed-pnl?${query}`, {
    method: "GET",
    headers: {
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-SIGN": signature,
      "X-BAPI-SIGN-TYPE": "2",
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow
    }
  });

  if (!response.ok) {
    const bodyText = await response.text();
    await logDebug("bybit.api:error", {
      status: response.status,
      statusText: response.statusText,
      body: bodyText
    });

    if (response.status === 404) {
      return {
        items: [],
        nextCursor: null,
        windowEnd
      };
    }

    throw new Error(`Bybit API error (${response.status}): ${bodyText || "closed pnl endpoint returned 404"}`);
  }

  const payload = (await response.json()) as {
    retCode: number;
    retMsg: string;
    result?: { list?: BybitClosedPnl[]; nextPageCursor?: string };
  };

  if (payload.retCode !== 0) {
    await logDebug("bybit.api:response_error", payload);
    throw new Error(`Bybit API error: ${payload.retMsg}`);
  }

  await logDebug("bybit.api:response", {
    count: payload.result?.list?.length ?? 0,
    nextCursor: payload.result?.nextPageCursor ?? null,
    sample: payload.result?.list ? payload.result.list.slice(0, 2) : []
  });

  return {
    items: payload.result?.list ?? [],
    nextCursor: payload.result?.nextPageCursor ?? null,
    windowEnd
  };
}

export async function fetchClosedPnlWindow(options: {
  apiKey: string;
  apiSecret: string;
  startTime: number;
  endTime: number;
}) {
  const results: BybitClosedPnl[] = [];
  let cursor: string | undefined;
  let currentStart = options.startTime;

  do {
    const pageEnd = Math.min(options.endTime, currentStart + 7 * 24 * 60 * 60 * 1000);
    const { items, nextCursor, windowEnd } = await fetchClosedPnlPage({
      ...options,
      startTime: currentStart,
      endTime: pageEnd,
      cursor
    });

    results.push(...items);
    cursor = nextCursor ?? undefined;
    if (!cursor) {
      currentStart = windowEnd;
    }
  } while (cursor || currentStart < options.endTime);

  return results;
}

export async function fetchWalletBalance({
  apiKey,
  apiSecret
}: {
  apiKey: string;
  apiSecret: string;
}) {
  const params = new URLSearchParams({ accountType: "UNIFIED" });
  const query = params.toString();
  const timestamp = Date.now().toString();
  const recvWindow = DEFAULT_RECV_WINDOW;
  const signature = createSignature({ apiKey, apiSecret, timestamp, recvWindow, query });

  await logDebug("bybit.api:request", {
    path: "/v5/account/wallet-balance",
    query
  });

  const response = await fetch(`${BASE_URL}/v5/account/wallet-balance?${query}`, {
    method: "GET",
    headers: {
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-SIGN": signature,
      "X-BAPI-SIGN-TYPE": "2",
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow
    }
  });

  if (!response.ok) {
    const bodyText = await response.text();
    await logDebug("bybit.api:error", {
      status: response.status,
      statusText: response.statusText,
      body: bodyText
    });
    throw new Error(`Bybit API error (${response.status}): ${bodyText}`);
  }

  const payload = (await response.json()) as {
    retCode: number;
    retMsg: string;
    result?: {
      list?: Array<{
        totalEquity?: string;
        totalWalletBalance?: string;
        totalAvailableBalance?: string;
        availableToWithdraw?: string;
        coin: Array<{ equity?: string; availableBalance?: string; coin?: string }>;
      }>;
    };
  };

  if (payload.retCode !== 0) {
    await logDebug("bybit.api:response_error", payload);
    throw new Error(`Bybit API error: ${payload.retMsg}`);
  }

  await logDebug("bybit.api:response", {
    count: payload.result?.list?.length ?? 0,
    sample: payload.result?.list ? payload.result.list.slice(0, 1) : []
  });

  const account = payload.result?.list?.[0];
  if (!account) return null;

  const usdt = account.coin?.find((c) => c.coin === "USDT") ?? account.coin?.[0];
  const walletBalance =
    account.totalWalletBalance !== undefined
      ? Number(account.totalWalletBalance)
      : usdt?.availableBalance !== undefined
        ? Number(usdt.availableBalance)
        : 0;
  const availableBalance =
    account.totalAvailableBalance !== undefined
      ? Number(account.totalAvailableBalance)
      : account.availableToWithdraw !== undefined
        ? Number(account.availableToWithdraw)
        : usdt?.availableBalance !== undefined
          ? Number(usdt.availableBalance)
          : 0;
  const equity =
    account.totalEquity !== undefined
      ? Number(account.totalEquity)
      : usdt?.equity !== undefined
        ? Number(usdt.equity)
        : walletBalance;

  return {
    balance: walletBalance,
    equity,
    available_balance: availableBalance
  };
}
