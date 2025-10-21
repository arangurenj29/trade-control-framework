import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressMission } from "@/components/ascenso/progress-mission";
import type { AscensoPageData } from "@/lib/dto";

export function AscensoOverview({ data }: { data: AscensoPageData }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          {data.summary ? (
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryItem label="Nivel" value={`Nivel ${data.summary.level_perfil}`} />
              <SummaryItem label="XP" value={`${data.summary.xp} XP`} />
              <SummaryItem label="Racha cumplimiento" value={`${data.summary.streak_cumplimiento} días`} />
              <SummaryItem label="Badges" value={`${data.summary.badges.length}`} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Completa tu primer día de métricas para activar tu impulso.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Misiones activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.missions.length > 0 ? (
            data.missions.map((mission) => (
              <ProgressMission key={mission.id} mission={mission} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay misiones activas esta semana.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
