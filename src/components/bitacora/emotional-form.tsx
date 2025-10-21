"use client";

import * as React from "react";
import { useFormState } from "react-dom";
import { upsertEmotionalLogAction, type EmotionalActionState } from "@/lib/actions/emotional";
import { Button } from "@/components/ui/button";

const initialState: EmotionalActionState = { status: "idle" };

const ratingOptions = [
  { value: "1", label: "1 - Muy bajo" },
  { value: "2", label: "2" },
  { value: "3", label: "3 - Neutral" },
  { value: "4", label: "4" },
  { value: "5", label: "5 - Muy alto" }
];

export function EmotionalForm({
  today
}: {
  today: {
    log_date: string;
    estado_antes: number;
    estado_despues: number;
    confianza: number;
    cansancio: number;
    claridad: number;
    emocion_dominante: string | null;
    reflexion: string | null;
    gratitud: string | null;
  } | null;
}) {
  const [state, formAction] = useFormState(upsertEmotionalLogAction, initialState);

  const defaultDate = today?.log_date ?? new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    if (state.status === "success") {
      const form = document.getElementById("emotional-form") as HTMLFormElement | null;
      form?.reset();
    }
  }, [state.status]);

  return (
    <form id="emotional-form" action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha">
          <input
            type="date"
            name="log_date"
            defaultValue={defaultDate}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          />
        </Field>
        <Field label="Emoción dominante">
          <input
            type="text"
            name="emocion_dominante"
            defaultValue={today?.emocion_dominante ?? ""}
            placeholder="Ej. Ansiedad, calma, enfoque"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          />
        </Field>
        {renderSelect("Estado antes de operar", "estado_antes", today?.estado_antes)}
        {renderSelect("Estado después de operar", "estado_despues", today?.estado_despues)}
        {renderSelect("Confianza", "confianza", today?.confianza)}
        {renderSelect("Cansancio", "cansancio", today?.cansancio)}
        {renderSelect("Claridad mental", "claridad", today?.claridad)}
      </div>

      <Field label="Reflexión breve (¿Qué aprendiste hoy?)">
        <textarea
          name="reflexion"
          defaultValue={today?.reflexion ?? ""}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        />
      </Field>

      <Field label="Gratitud (3 cosas positivas)">
        <textarea
          name="gratitud"
          defaultValue={today?.gratitud ?? ""}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        />
      </Field>

      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}

      <Button type="submit">Guardar bitácora</Button>
    </form>
  );
}

function renderSelect(label: string, name: string, value?: number) {
  return (
    <Field label={label} key={name}>
      <select
        name={name}
        defaultValue={value ? String(value) : "3"}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        {ratingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
