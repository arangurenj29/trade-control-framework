import { requireSessionProfile } from "@/lib/auth";
import { WeeklyReport } from "@/components/reportes/weekly-report";
import { getWeeklyReportData } from "@/lib/services/reportes";

export default async function ReportesPage() {
  const profile = await requireSessionProfile();
  const data = await getWeeklyReportData(profile.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Panorama semanal de PnL, cumplimiento y sugerencias de fase.
        </p>
      </header>
      <WeeklyReport data={data} />
    </div>
  );
}
