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

      <TradesTable
        openTrades={data.openTrades}
        closedTrades={data.closedTrades}
      />
    </div>
  );
}
