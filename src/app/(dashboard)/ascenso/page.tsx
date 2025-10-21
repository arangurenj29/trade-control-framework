import { requireSessionProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AscensoOverview } from "@/components/ascenso/ascenso-overview";
import { getAscensoData } from "@/lib/services/ascenso";

export default async function AscensoPage() {
  const profile = await requireSessionProfile();
  const data = await getAscensoData(profile.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ascenso</h1>
        <p className="text-sm text-muted-foreground">
          Construye impulso con hábitos visibles, desbloquea hitos y mantén tu disciplina en ascenso.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Plan de recuperación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Resumen de fases</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-muted text-foreground">
                  <tr>
                    <th className="px-3 py-2">Fase</th>
                    <th className="px-3 py-2">Duración guía</th>
                    <th className="px-3 py-2">Objetivo</th>
                    <th className="px-3 py-2">Condición de avance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">0. Reset mental</td>
                    <td className="border-t px-3 py-2">3–5 días</td>
                    <td className="border-t px-3 py-2">Diagnóstico, inventario del daño, comprometerse al reinicio.</td>
                    <td className="border-t px-3 py-2">No operar; completar revisión de errores técnicos, de gestión y emocionales.</td>
                  </tr>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">I. Estabilización</td>
                    <td className="border-t px-3 py-2">4–6 semanas</td>
                    <td className="border-t px-3 py-2">Reentrenar disciplina y riesgo con tamaño controlado.</td>
                    <td className="border-t px-3 py-2">Drawdown ≤ 5%, ≥ 40 trades, Winrate ≥ 45%.</td>
                  </tr>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">II. Recuperación agresiva</td>
                    <td className="border-t px-3 py-2">≈ 3 meses</td>
                    <td className="border-t px-3 py-2">Acelerar crecimiento con setups A+ y límites de exposición.</td>
                    <td className="border-t px-3 py-2">Rentabilidad ≥ 15%, DD ≤ 8%, 3 semanas consecutivas en positivo.</td>
                  </tr>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">III. Consolidación</td>
                    <td className="border-t px-3 py-2">4–6 meses</td>
                    <td className="border-t px-3 py-2">Duplicar capital y preparar fondeo externo.</td>
                    <td className="border-t px-3 py-2">Equity ≥ $5 000 y 3 meses positivos consecutivos.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs">
              Cada fase lleva su bitácora independiente y se pausa si se incumple alguna métrica. El sistema registra ascensos y descensos automáticos cuando recalculas las métricas en la vista de trades.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Gestión operativa e impulso</h2>
            <ul className="grid gap-2 md:grid-cols-2">
              <li className="rounded-md border bg-muted/60 p-3">
                <span className="font-medium text-foreground">Riesgo por operación:</span>
                <br />2–3 % del capital (hasta 3 % en niveles avanzados).
              </li>
              <li className="rounded-md border bg-muted/60 p-3">
                <span className="font-medium text-foreground">Apalancamiento:</span>
                <br />5× en setups base, 10× máximo para oportunidades A+.
              </li>
              <li className="rounded-md border bg-muted/60 p-3">
                <span className="font-medium text-foreground">Operaciones simultáneas:</span>
                <br />Hasta 2 abiertas para evitar sobreexposición.
              </li>
              <li className="rounded-md border bg-muted/60 p-3">
                <span className="font-medium text-foreground">Riesgo mensual:</span>
                <br />Drawdown ≤ 10 %, pausa obligatoria al -7 %.
              </li>
            </ul>
            <p>
              El módulo de Ascenso convierte estas métricas en XP: 15 XP por trade ganador, 5 XP por perdedor. Cada 100 XP subes de nivel de perfil; los badges resaltan hitos como 5 o 10 días disciplinados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Blindaje antiliquidación</h2>
            <ul className="list-disc space-y-1 pl-4">
              <li>Stop loss estructural obligatorio en todas las operaciones.</li>
              <li>SL operativo diario máximo 5 % del equity y valor en riesgo total ≤ 10 %.</li>
              <li>Prohibido promediar a la baja.</li>
              <li>Checklist técnico/emocional al inicio y cierre de la sesión.</li>
            </ul>
            <p className="italic text-xs">
              “El trader que respeta su stop conserva su capacidad de volver a ganar.”
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Temporalidades por tipo de operativa</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-muted text-foreground">
                  <tr>
                    <th className="px-3 py-2">Modalidad</th>
                    <th className="px-3 py-2">Analiza en</th>
                    <th className="px-3 py-2">Proyecta en</th>
                    <th className="px-3 py-2">Ejecuta en</th>
                    <th className="px-3 py-2">Confirmación</th>
                    <th className="px-3 py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">Swing</td>
                    <td className="border-t px-3 py-2">1D</td>
                    <td className="border-t px-3 py-2">H4</td>
                    <td className="border-t px-3 py-2">H1</td>
                    <td className="border-t px-3 py-2">Estructura + liquidez</td>
                    <td className="border-t px-3 py-2">Opera sólo en zonas premium/discount, sin forzar entradas.</td>
                  </tr>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">Intradía</td>
                    <td className="border-t px-3 py-2">H1</td>
                    <td className="border-t px-3 py-2">M15</td>
                    <td className="border-t px-3 py-2">M5</td>
                    <td className="border-t px-3 py-2">Ruptura + volumen</td>
                    <td className="border-t px-3 py-2">Prioriza sesiones principales; evita horas muertas.</td>
                  </tr>
                  <tr>
                    <td className="border-t px-3 py-2 font-medium text-foreground">Scalp</td>
                    <td className="border-t px-3 py-2">M15</td>
                    <td className="border-t px-3 py-2">M5</td>
                    <td className="border-t px-3 py-2">M1</td>
                    <td className="border-t px-3 py-2">Momentum + volumen</td>
                    <td className="border-t px-3 py-2">Sólo en alta volatilidad y con liquidez profunda.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Bitácora integral y KPIs</h2>
            <p>
              Cada trade registra tanto los datos técnicos (fecha, activo, R esperado vs. real, error técnico)
              como el estado emocional (energía, foco, emoción dominante y aprendizaje). Los KPIs que
              observamos en el dashboard se enfocan en mantener: Winrate ≥ 50 %, R:R ≥ 2, Expectancy > 0,
              Drawdown mensual ≤ 10 % y errores emocionales &lt; 15 %.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Automatización en la app</h2>
            <p>
              Cada vez que sincronizas nuevos trades y pulsas <strong>Recalcular métricas</strong>:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Actualizamos tus métricas de disciplina (cumplimiento, racha, TPs y drawdown estimado).</li>
              <li>Convertimos los resultados en XP y nivel de perfil, asignando insignias y registrando tu racha.</li>
              <li>Revisamos si corresponde subir o bajar de fase/nivel según las reglas de la tabla anterior.</li>
              <li>Guardamos un registro del cambio para que tengas trazabilidad completa.</li>
            </ul>
          </section>
        </CardContent>
      </Card>
      <AscensoOverview data={data} />
    </div>
  );
}
