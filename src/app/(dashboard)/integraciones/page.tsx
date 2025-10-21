import { requireSessionProfile } from "@/lib/auth";
import { BybitConnectionCard } from "@/components/bybit/bybit-connection-card";
import { countProcessedTrades, getBybitConnection } from "@/lib/services/bybit";
import { env } from "@/lib/env";

export default async function IntegracionesPage() {
  const profile = await requireSessionProfile();
  const [connection, processedTrades] = await Promise.all([
    getBybitConnection(profile.id),
    countProcessedTrades(profile.id)
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Integraciones</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tus credenciales de Bybit y sincroniza el historial cerrado (PnL) para alimentar métricas y balance.
        </p>
      </header>

      <BybitConnectionCard
        connection={connection}
        processedCount={processedTrades}
        syncWindowDays={env.bybitSyncDays}
      />
    </div>
  );
}
