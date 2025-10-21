import { Button } from "@/components/ui/button";
import type { Mission } from "@/lib/dto";

export function ProgressMission({ mission }: { mission: Mission }) {
  const progressPct = Math.min(100, Math.round((mission.progress / mission.target) * 100));

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold">{mission.title}</h3>
          <p className="text-sm text-muted-foreground">{mission.description}</p>
        </div>
        <Button variant="secondary">Revisar</Button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mission.progress} / {mission.target}</span>
          <span>+{mission.reward_xp} XP</span>
        </div>
      </div>
    </div>
  );
}
