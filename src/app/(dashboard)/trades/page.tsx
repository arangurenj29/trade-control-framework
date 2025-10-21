import { requireSessionProfile } from "@/lib/auth";
import { TradesTable } from "@/components/trades/trades-table";
import { getTradesPageData } from "@/lib/services/trade";
import { recomputeTradingSnapshotsAction } from "@/lib/actions/trade";
import { Button } from "@/components/ui/button";

export default async function TradesPage() {
  const profile = await requireSessionProfile();
  const data = await getTradesPageData(profile.id);

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

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Balance disponible" value={formatCurrency(data.stats.available_balance ?? data.stats.balance)} />
        <StatCard label="Equity" value={formatCurrency(data.stats.equity)} />
        <StatCard label="PnL (día)" value={formatCurrency(data.stats.pnl_day)} highlight />
        <StatCard label="PnL (semana)" value={formatCurrency(data.stats.pnl_week)} highlight />
        <StatCard label="PnL (mes)" value={formatCurrency(data.stats.pnl_month)} highlight className="md:col-span-2" />
      </section>

      <TradesTable
        openTrades={data.openTrades}
        closedTrades={data.closedTrades}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  className
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${className ?? ""}`}>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
