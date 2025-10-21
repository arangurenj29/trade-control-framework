"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { z } from "zod";
import { upsertPlanAction } from "@/lib/actions/plan";

type PlanFormValues = z.infer<typeof planSchema>;

const defaultPlan: PlanFormValues = {
  patrimonio: 0,
  r_pct: 1,
  sl_diario_r: -2,
  sl_semanal_r: -6,
  horarios: {
    session_start: "09:00",
    session_end: "16:00",
    buffer_minutes: 30
  },
  no_trade_days: [],
  apalancamiento_btceth_max: 5,
  apalancamiento_alts_max: 3,
  fase_actual: "Fase 1",
  nivel_actual: "Nivel 1",
  notes: ""
};

const dayOptions = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];

export function PlanEditor({
  initialValues
}: {
  initialValues?: Partial<PlanFormValues>;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      ...defaultPlan,
      ...initialValues
    }
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = form;

  useEffect(() => {
    form.register("no_trade_days");
  }, [form]);

  const noTradeDays = watch("no_trade_days");

  const toggleDay = (day: string) => {
    const exists = noTradeDays?.includes(day) ?? false;
    const updated = exists
      ? noTradeDays.filter((d) => d !== day)
      : [...(noTradeDays ?? []), day];
    setValue("no_trade_days", updated);
  };

  const onSubmit = (values: PlanFormValues) => {
    startTransition(async () => {
      await upsertPlanAction(values);
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label requiredIndicator>Patrimonio (USD)</Label>
          <Input type="number" step="0.01" {...register("patrimonio", { valueAsNumber: true })} />
          <ErrorMessage message={errors.patrimonio?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>R %</Label>
          <Input type="number" step="0.01" {...register("r_pct", { valueAsNumber: true })} />
          <ErrorMessage message={errors.r_pct?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>SL Diario (R)</Label>
          <Input type="number" step="0.1" {...register("sl_diario_r", { valueAsNumber: true })} />
          <ErrorMessage message={errors.sl_diario_r?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>SL Semanal (R)</Label>
          <Input type="number" step="0.1" {...register("sl_semanal_r", { valueAsNumber: true })} />
          <ErrorMessage message={errors.sl_semanal_r?.message} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label requiredIndicator>Inicio de sesión</Label>
          <Input type="time" {...register("horarios.session_start")} />
          <ErrorMessage message={errors.horarios?.session_start?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>Fin de sesión</Label>
          <Input type="time" {...register("horarios.session_end")} />
          <ErrorMessage message={errors.horarios?.session_end?.message} />
        </div>
        <div className="space-y-2">
          <Label>Buffer (min)</Label>
          <Input
            type="number"
            {...register("horarios.buffer_minutes", { valueAsNumber: true })}
          />
          <ErrorMessage message={errors.horarios?.buffer_minutes?.message} />
        </div>
      </section>

      <section className="space-y-3">
        <Label>Días sin operar</Label>
        <div className="flex flex-wrap gap-3">
          {dayOptions.map((day) => {
            const active = noTradeDays?.includes(day);
            return (
              <button
                key={day}
                type="button"
                className={`rounded-full border px-3 py-1 text-sm ${
                  active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label requiredIndicator>Apalancamiento BTC/ETH máx.</Label>
          <Input
            type="number"
            step="0.1"
            {...register("apalancamiento_btceth_max", { valueAsNumber: true })}
          />
          <ErrorMessage message={errors.apalancamiento_btceth_max?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>Apalancamiento Alts máx.</Label>
          <Input
            type="number"
            step="0.1"
            {...register("apalancamiento_alts_max", { valueAsNumber: true })}
          />
          <ErrorMessage message={errors.apalancamiento_alts_max?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>Fase actual</Label>
          <Input {...register("fase_actual")} />
          <ErrorMessage message={errors.fase_actual?.message} />
        </div>
        <div className="space-y-2">
          <Label requiredIndicator>Nivel actual</Label>
          <Input {...register("nivel_actual")} />
          <ErrorMessage message={errors.nivel_actual?.message} />
        </div>
      </section>

      <section className="space-y-2">
        <Label>Notas</Label>
        <Textarea rows={4} {...register("notes")} />
        <ErrorMessage message={errors.notes?.message} />
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar plan"}
      </Button>
    </form>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
