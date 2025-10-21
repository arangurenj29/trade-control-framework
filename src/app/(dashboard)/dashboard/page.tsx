import { requireSessionProfile } from "@/lib/auth";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardData } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const profile = await requireSessionProfile();
  const data = await getDashboardData(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Controla tu disciplina diaria y el estado del mercado.
        </p>
      </div>
      <DashboardOverview data={data} />
    </div>
  );
}
