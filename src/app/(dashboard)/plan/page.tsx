import { requireSessionProfile } from "@/lib/auth";
import { PlanEditor } from "@/components/plan/plan-editor";
import { PlanHistory } from "@/components/plan/plan-history";
import { getPlanData } from "@/lib/services/plan";
import { levelOptions, phaseOptions } from "@/lib/validations";

export default async function PlanPage() {
  const profile = await requireSessionProfile();
  const { activePlan, versions } = await getPlanData(profile.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mi Plan</h1>
        <p className="text-sm text-muted-foreground">
          Define tus límites operativos para que el sistema pueda aplicarlos con RLS.
        </p>
      </header>
      <section>
        <PlanEditor initialValues={activePlan ? mapPlanToForm(activePlan) : undefined} />
      </section>
      <PlanHistory versions={versions} />
    </div>
  );
}

function mapPlanToForm(plan: NonNullable<Awaited<ReturnType<typeof getPlanData>>["activePlan"]>) {
  const safePhase = phaseOptions.includes(plan.fase_actual as (typeof phaseOptions)[number])
    ? plan.fase_actual
    : phaseOptions[1];
  const safeLevel = levelOptions.includes(plan.nivel_actual as (typeof levelOptions)[number])
    ? plan.nivel_actual
    : levelOptions[0];

  return {
    patrimonio: plan.patrimonio,
    r_pct: plan.r_pct,
    sl_diario_r: plan.sl_diario_r,
    sl_semanal_r: plan.sl_semanal_r,
    horarios: plan.horarios,
    no_trade_days: plan.no_trade_days,
    apalancamiento_btceth_max: plan.apalancamiento_btceth_max,
    apalancamiento_alts_max: plan.apalancamiento_alts_max,
    fase_actual: safePhase,
    nivel_actual: safeLevel,
    plan_start_date: plan.plan_start_date,
    notes: plan.notes ?? ""
  };
}
