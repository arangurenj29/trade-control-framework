import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WeeklyReportData } from "@/lib/dto";

export function WeeklyReport({ data }: { data: WeeklyReportData | null }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reporte semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no hay suficiente historial para generar el reporte semanal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Summary label="Rango" value={`${format(new Date(data.rango.inicio), "PP", { locale: es })} - ${format(new Date(data.rango.fin), "PP", { locale: es })}`} />
          <Summary label="PnL (R)" value={`${data.pnl_r.toFixed(2)} R`} />
          <Summary
            label="PnL (USD)"
            value={data.pnl_monetario.toLocaleString("es-ES", {
              style: "currency",
              currency: "USD"
            })}
          />
          <Summary label="Cumplimiento" value={`${data.cumplimiento_pct.toFixed(1)}%`} />
          <Summary label="Racha días verdes" value={`${data.streak_dias_verdes}`} />
          <Summary
            label="Violaciones"
            value={`SL diario: ${data.violaciones.sl_diario} / SL semanal: ${data.violaciones.sl_semanal}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sugerencia de fase</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {data.recomendacion_fase ?? "Mantente en la fase actual hasta consolidar resultados."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trades de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>SL</TableHead>
                <TableHead>PnL (R)</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Sin operaciones registradas esta semana.
                  </TableCell>
                </TableRow>
              ) : (
                data.trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>{trade.side}</TableCell>
                    <TableCell>{trade.entry}</TableCell>
                    <TableCell>{trade.sl}</TableCell>
                    <TableCell>{trade.pnl_r?.toFixed(2) ?? "-"}</TableCell>
                    <TableCell>
                      {format(new Date(trade.close_time ?? trade.open_time), "PPp", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
