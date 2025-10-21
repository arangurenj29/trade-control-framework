"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { TradeListItem } from "@/lib/dto";

export function TradesTable({
  openTrades,
  closedTrades
}: {
  openTrades: TradeListItem[];
  closedTrades: TradeListItem[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trades abiertos</h2>
        <TradeTable trades={openTrades} variant="open" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historial reciente</h2>
        <TradeTable trades={closedTrades} variant="closed" />
      </section>
    </div>
  );
}

function TradeTable({
  trades,
  variant
}: {
  trades: TradeListItem[];
  variant: "open" | "closed";
}) {

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Activo</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Entrada</TableHead>
          <TableHead>SL</TableHead>
          <TableHead>Riesgo (R)</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Abierto</TableHead>
          <TableHead>Cerrado</TableHead>
          <TableHead>PnL (R)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
              {variant === "open"
                ? "No tienes operaciones abiertas."
                : "Aún no hay cierres registrados."}
            </TableCell>
          </TableRow>
        ) : (
          trades.map((trade) => (
            <TableRow key={trade.id} className={variant === "open" ? "bg-amber-50" : undefined}>
              <TableCell>{trade.symbol}</TableCell>
              <TableCell className="uppercase">{trade.side}</TableCell>
              <TableCell>{trade.entry}</TableCell>
              <TableCell>{trade.sl}</TableCell>
              <TableCell>{trade.risk_en_r.toFixed(2)}</TableCell>
              <TableCell className="capitalize">{trade.status}</TableCell>
              <TableCell>
                {format(new Date(trade.open_time), "PPp", { locale: es })}
              </TableCell>
              <TableCell>
                {trade.close_time
                  ? format(new Date(trade.close_time), "PPp", { locale: es })
                  : "-"}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {trade.pnl_r !== null ? `${trade.pnl_r.toFixed(2)} R` : "-"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      {variant === "closed" ? (
        <TableCaption>* Sólo se muestran los 20 más recientes.</TableCaption>
      ) : null}
    </Table>
  );
}
