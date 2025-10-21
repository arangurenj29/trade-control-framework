import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, ArrowRight, Gauge, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { InfoBadge } from "@/components/ui/info-badge";
import type { DashboardData } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { refreshSemaforoAction } from "@/lib/actions/semaforo";
import { NotionalCalculator } from "@/components/dashboard/notional-calculator";

const estadoConfig: Record<
  NonNullable<DashboardData["semaforo"]>["estado"],
  { label: string; badgeClass: string }
> = {
  Verde: { label: "Verde", badgeClass: "bg-emerald-500 text-white" },
  Amarillo: { label: "Amarillo", badgeClass: "bg-amber-500 text-black" },
  Rojo: { label: "Rojo", badgeClass: "bg-red-500 text-white" },
  Indeterminado: { label: "Indeterminado", badgeClass: "bg-slate-500 text-white" }
};

const phaseTooltip = (
  <div className="space-y-1">
    <p className="font-medium text-foreground">Fases del plan:</p>
    <ul className="list-disc space-y-1 pl-4">
      <li>
        <span className="font-semibold text-foreground">Fase 0 · Reset mental:</span> pausa de 3–5 días para
        diagnosticar errores y comprometerte al reinicio.
      </li>
      <li>
        <span className="font-semibold text-foreground">Fase 1 · Estabilización:</span> 4–6 semanas reentrenando
        disciplina con drawdown ≤ 5%, ≥ 40 trades y winrate ≥ 45%.
      </li>
      <li>
        <span className="font-semibold text-foreground">Fase 2 · Recuperación agresiva:</span> cerca de 3 meses
        apuntando a rentabilidad ≥ 15% y drawdown ≤ 8% con tres semanas positivas.
      </li>
      <li>
        <span className="font-semibold text-foreground">Fase 3 · Consolidación:</span> 4–6 meses para duplicar el
        capital y sostener 3 meses consecutivos en verde.
      </li>
    </ul>
  </div>
);

const levelTooltip = (
  <div className="space-y-1">
    <p className="font-medium text-foreground">Nivel operativo dentro de cada fase:</p>
    <ul className="list-disc space-y-1 pl-4">
      <li>
        <span className="font-semibold text-foreground">Nivel 1:</span> riesgo conservador (2% por trade), tamaño
        máximo 10% del capital, foco en setups A.
      </li>
      <li>
        <span className="font-semibold text-foreground">Nivel 2:</span> tras 10 días verdes/TP aumentas margen a 25%,
        manteniendo dos operaciones simultáneas como máximo.
      </li>
      <li>
        <span className="font-semibold text-foreground">Nivel 3:</span> máxima confianza dentro de la fase, tamaño hasta
        40% del capital, pero sigues sometido a la regla de -4 SL en 48 h.
      </li>
    </ul>
    <p className="text-xs text-muted-foreground">Cualquier -4 SL en 48 h devuelve un nivel atrás.</p>
  </div>
);

const profileTooltip = (
  <div className="space-y-1">
    <p className="font-medium text-foreground">Perfil Ascenso (hábitos):</p>
    <ul className="list-disc space-y-1 pl-4">
      <li>El XP sube 15 puntos por trade ganador y 5 por perdedor.</li>
      <li>Cada 100 XP avanzas un nivel de perfil (máximo 3) y desbloqueas insignias.</li>
      <li>Se reinicia un nivel si cae la racha o violas la regla de -4 SL en 48 h.</li>
    </ul>
  </div>
);

const capitalTooltip = (
  <div className="space-y-1">
    <p className="font-medium text-foreground">R disponible:</p>
    <p>
      Es el capital que puedes arriesgar en la próxima operación (patrimonio × %R definido en tu plan). Debe mantenerse en
      0,5–1% por trade según tu etapa.
    </p>
  </div>
);

const slDayTooltip = (
  <div className="space-y-1">
    <p className="font-medium text-foreground">Stop-loss diario:</p>
    <p>
      Si alcanzas -2R en un día se pausa la operativa hasta el día siguiente para preservar tu capital emocional y financiero.
    </p>
  </div>
);

const slWeekTooltip = (
  <div className="space-y-1">
    <p className="font-medium text-foreground">Stop-loss semanal:</p>
    <p>
      Al llegar a -6R en la semana detienes la operativa hasta el lunes siguiente. Evita que una racha emocional arruine el plan.
    </p>
  </div>
);

export function DashboardOverview({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <Gauge className="h-4 w-4 text-primary" />
              Semáforo Global
            </div>
            <CardDescription>Estado automático de mercado para hoy</CardDescription>
            <div className="mt-2 text-xs text-muted-foreground">
              {data.semaforo?.computed_at
                ? `Última actualización: ${formatDistanceToNow(new Date(data.semaforo.computed_at), {
                    addSuffix: true,
                    locale: es
                  })}`
                : "Sin registros aún"}
            </div>
          </div>
          {data.semaforo ? (
            <Badge className={cn("text-xs", estadoConfig[data.semaforo.estado].badgeClass)}>
              {estadoConfig[data.semaforo.estado].label}
            </Badge>
          ) : (
            <Badge variant="secondary">Sin datos</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Acción sugerida</div>
            <p className="text-sm">
              {data.can_operate
                ? "Puedes operar siguiendo los límites configurados."
                : data.bloqueo_motivo ?? "Consulta tu plan para más detalles."}
            </p>
          </div>
          {data.semaforo?.analisis ? (
            <details className="rounded-md border bg-muted/40 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline">
                Ver análisis
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {data.semaforo.analisis}
              </p>
            </details>
          ) : null}
          <Separator />
          <form action={refreshSemaforoAction} className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              El semáforo se refresca automáticamente cada 12 horas.
            </div>
            <Button type="submit" size="sm" variant="outline">
              Actualizar ahora
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Camino de Ascenso
          </div>
          <CardDescription>Resumen operativo y progreso hacia el siguiente nivel</CardDescription>
          <details className="mt-2 space-y-2 text-xs text-muted-foreground">
            <summary className="flex cursor-pointer items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
              <Info className="h-3.5 w-3.5" />
              ¿Cómo funciona?
            </summary>
            <ul className="list-disc space-y-1 pl-4">
              <li>Subes de nivel cuando cumples ≥ 85% y mantienes 10 días verdes o 10 TPs semanales.</li>
              <li>Bajas de nivel si registras 4 SL ≥ 1R en las últimas 48 h (se prioriza esta regla).</li>
              <li>Al subir de nivel, el plan operativo se ajusta automáticamente; al bajar, se reduce.</li>
              <li>Los XP reflejan tu impulso: cada trade positivo suma 15 XP, negativo 5 XP.</li>
            </ul>
          </details>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.plan ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <InfoRow label={<InfoBadge label="Fase actual" tooltip={phaseTooltip} />}>
                  {data.plan.fase_actual} de 3
                </InfoRow>
                <InfoRow label={<InfoBadge label="Nivel operativo" tooltip={levelTooltip} />}>
                  {data.plan.nivel_actual} de 3
                </InfoRow>
                <InfoRow label={<InfoBadge label="Perfil Ascenso" tooltip={profileTooltip} />}>
                  {data.ascenso ? `Nivel ${Math.min(3, data.ascenso.level_perfil)} de 3` : "Sin datos"}
                </InfoRow>
                <InfoRow label={<InfoBadge label="R Disponible" tooltip={capitalTooltip} />}>
                  {data.plan.r_disponible.toFixed(2)} R
                </InfoRow>
                <InfoRow label={<InfoBadge label="SL restante (día)" tooltip={slDayTooltip} />}>
                  {data.plan.sl_restante_dia.toFixed(2)} R
                </InfoRow>
                <InfoRow label={<InfoBadge label="SL restante (semana)" tooltip={slWeekTooltip} />}>
                  {data.plan.sl_restante_semana.toFixed(2)} R
                </InfoRow>
              </div>
              <AscensoProgress
                phase={data.plan.fase_actual}
                level={data.plan.nivel_actual}
                metrics={data.metrics}
                ascenso={data.ascenso}
              />
              <AscensoSnapshot
                ascenso={data.ascenso}
                planLevel={data.plan.nivel_actual}
                planPhase={data.plan.fase_actual}
              />
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href="/trades">Ver historial de trades</a>
                </Button>
                <Button asChild variant="secondary">
                  <a href="/ascenso" className="inline-flex items-center gap-1">
                    Revisar misiones <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Completa tu plan para habilitar el seguimiento diario.
            </p>
          )}
        </CardContent>
      </Card>

      <NotionalCalculator
        className="lg:col-span-2"
        defaultCapital={data.plan?.patrimonio ?? null}
        defaultLeverage={data.plan?.apalancamiento_btceth_max ?? null}
        defaultRiskPercent={data.plan?.r_pct ?? null}
        planLevel={data.plan?.nivel_actual ?? null}
      />

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ruta de Disciplina</CardTitle>
          <CardDescription>Indicadores clave para saber si sigues el plan</CardDescription>
        </CardHeader>
        <CardContent>
          {data.metrics ? (
            <div className="grid gap-4 md:grid-cols-5">
              <MetricBox label="PnL día" value={`${data.metrics.pnl_r_dia.toFixed(2)} R`} />
              <MetricBox label="PnL semana" value={`${data.metrics.pnl_r_semana.toFixed(2)} R`} />
              <MetricBox label="TP validados" value={data.metrics.tp_count.toString()} />
              <MetricBox label="Racha días verdes" value={data.metrics.streak_dias_verdes.toString()} />
              <MetricBox
                label="Cumplimiento"
                value={`${data.metrics.cumplimiento_pct.toFixed(1)}%`}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay métricas registradas. Ingresa tus operaciones para comenzar.
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function InfoRow({
  label,
  children
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function AscensoProgress({
  phase,
  level,
  metrics,
  ascenso
}: {
  phase: string;
  level: string;
  metrics: DashboardData["metrics"];
  ascenso: DashboardData["ascenso"];
}) {
  const cumplimiento = metrics?.cumplimiento_pct ?? 0;
  const streak = metrics?.streak_dias_verdes ?? 0;
  const xp = ascenso?.xp ?? 0;
  const xpProgress = ascenso ? xp % 100 : cumplimiento;
  const progress = Math.max(0, Math.min(100, ascenso ? xpProgress : cumplimiento));
  const nextMilestone = ascenso
    ? `${Math.max(0, 100 - xpProgress).toFixed(0)} XP para el siguiente nivel`
    : `Cumplimiento ${cumplimiento.toFixed(0)}%`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
        <span>Camino a la siguiente etapa</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {`Estás en ${phase} / ${level}. ${nextMilestone}. Racha actual: ${streak} días.`}
      </p>
    </div>
  );
}

function AscensoSnapshot({
  ascenso,
  planLevel,
  planPhase
}: {
  ascenso: DashboardData["ascenso"];
  planLevel: string;
  planPhase: string;
}) {
  if (!ascenso) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay suficiente historial para activar el módulo Ascenso.
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Perfil Ascenso</div>
          <div className="text-lg font-semibold">Nivel {ascenso.level_perfil}</div>
          <p className="text-xs text-muted-foreground">
            Plan operativo: {planPhase} / {planLevel}
          </p>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">XP acumulado</div>
          <div className="text-lg font-semibold">{ascenso.xp} XP</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Racha cumplimiento</div>
          <div className="text-lg font-semibold">{ascenso.streak_cumplimiento} días</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="text-xs uppercase text-muted-foreground">Insignias recientes</div>
        {ascenso.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ascenso.badges.map((badge: string) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Completa misiones para desbloquear nuevas insignias.
          </p>
        )}
      </div>
    </div>
  );
}
