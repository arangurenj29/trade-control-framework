import { requireSessionProfile } from "@/lib/auth";
import { EmotionalForm } from "@/components/bitacora/emotional-form";
import { EmotionalHistory } from "@/components/bitacora/emotional-history";
import { getEmotionalLogsPageData } from "@/lib/services/emotional";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BitacoraPage() {
  const profile = await requireSessionProfile();
  const data = await getEmotionalLogsPageData(profile.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bitácora emocional</h1>
        <p className="text-sm text-muted-foreground">
          Registra tu estado mental antes y después de operar para detectar patrones y mantener disciplina.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Registro diario</CardTitle>
          <CardDescription>
            Evalúa tu energía, confianza y claridad. Si alguna variable es ≤ 3, considera pausar la sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmotionalForm today={data.today} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
          <CardDescription>Repasa tus últimas entradas para identificar tendencias y gatillos emocionales.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmotionalHistory entries={data.latest} />
        </CardContent>
      </Card>
    </div>
  );
}
