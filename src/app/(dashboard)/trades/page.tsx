import { requireSessionProfile } from "@/lib/auth";
import { TradesTable } from "@/components/trades/trades-table";
import { getTradesPageData } from "@/lib/services/trade";
import { recomputeTradingSnapshotsAction } from "@/lib/actions/trade";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function TradesPage({ searchParams }: PageProps) {
  const profile = await requireSessionProfile();
  const pageParam = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const parsedPage = Number(pageParam);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const pageSizeParam = Array.isArray(searchParams.pageSize)
    ? searchParams.pageSize[0]
    : searchParams.pageSize;
  const parsedPageSize = Number(pageSizeParam);
  const pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0
      ? Math.min(200, Math.floor(parsedPageSize))
      : undefined;

  const data = await getTradesPageData(profile.id, { page, pageSize });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Historial de trades</h1>
        <p className="text-sm text-muted-foreground">
          Operaciones sincronizadas automáticamente desde Bybit. Recalcula métricas cuando necesites refrescar los datos del dashboard.
        </p>
      </header>

      <form
        action={recomputeTradingSnapshotsAction}
        className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
      >
        <span className="text-muted-foreground">
          Los cierres y métricas se recalculan en base a los trades históricos.
        </span>
        <Button type="submit" variant="outline">
          Recalcular métricas
        </Button>
      </form>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Balance" value={data.stats.balance} />
        <StatCard label="Balance disponible" value={data.stats.available_balance} />
        <StatCard label="Equity" value={data.stats.equity} />
        <StatCard label="PnL (mes)" value={data.stats.pnl_month} signed />
      </section>

      <TradesTable trades={data.closedTrades} pagination={data.pagination} />
    </div>
  );
}

function StatCard({
  label,
  value,
  signed = false,
  className
}: {
  label: string;
  value: number | null;
  signed?: boolean;
  className?: string;
}) {
  const formattedValue = formatCurrency(value, { signed });
  const toneClass =
    value === null
      ? "text-muted-foreground"
      : value > 0
        ? "text-emerald-500"
        : value < 0
          ? "text-rose-500"
          : "text-foreground";

  return (
    <div className={cn("min-h-[96px] min-w-[160px] rounded-xl border bg-card p-4 shadow-sm", className)}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-2 text-lg font-semibold leading-tight tabular-nums break-words",
          toneClass
        )}
        title={formattedValue}
      >
        {formattedValue}
      </div>
    </div>
  );
}

function formatCurrency(value: number | null, { signed = false }: { signed?: boolean } = {}) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...(signed ? { signDisplay: "always" as const } : {})
  }).format(value);
}
