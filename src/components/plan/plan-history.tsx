import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlanVersion } from "@/lib/dto";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function PlanHistory({ versions }: { versions: PlanVersion[] }) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de versiones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no hay versiones registradas. Crea tu plan para iniciar el versionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de versiones</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versión</TableHead>
              <TableHead>Fase/Nivel</TableHead>
              <TableHead>Patrimonio</TableHead>
              <TableHead>R %</TableHead>
              <TableHead>SL Diario</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.version}</TableCell>
                <TableCell>
                  {plan.fase_actual} / {plan.nivel_actual}
                </TableCell>
                <TableCell>{plan.patrimonio.toLocaleString("es-ES", { style: "currency", currency: "USD" })}</TableCell>
                <TableCell>{plan.r_pct}%</TableCell>
                <TableCell>{plan.sl_diario_r} R</TableCell>
                <TableCell>
                  {plan.plan_start_date
                    ? format(new Date(plan.plan_start_date), "PP", { locale: es })
                    : "—"}
                </TableCell>
                <TableCell>
                  {format(new Date(plan.updated_at), "PPpp", { locale: es })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
