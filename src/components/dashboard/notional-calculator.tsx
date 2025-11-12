"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotionalCalculatorProps = {
  defaultCapital: number | null;
  defaultLeverage: number | null;
  defaultRiskPercent: number | null;
  className?: string;
  planLevel: string | null;
};

export function NotionalCalculator({
  defaultCapital,
  defaultLeverage,
  defaultRiskPercent,
  className,
  planLevel
}: NotionalCalculatorProps) {
  const [capital, setCapital] = React.useState<number>(defaultCapital ?? 0);
  const [leverage, setLeverage] = React.useState<number>(defaultLeverage ?? 1);
  const [riskPercent, setRiskPercent] = React.useState<number>(defaultRiskPercent ?? 1);

  const riskFraction = Number.isFinite(riskPercent) ? riskPercent / 100 : 0;
  const notional = capital * riskFraction * leverage;
  const normalizedLevel = normalizeLevel(planLevel);
  const guidance = levelGuidance[normalizedLevel];

  const handleNumberChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: string,
    fallback: number
  ) => {
    const parsed = Number(value);
    setter(Number.isFinite(parsed) ? parsed : fallback);
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Calculadora de posición nocional</CardTitle>
          <CardDescription>
            Usa tu capital disponible, % a arriesgar y apalancamiento para estimar el tamaño de la posición.
          </CardDescription>
        </div>
        <Badge variant="outline" className="w-fit">
          ((Capital × %)/100) × Apalancamiento
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <Field
            label="Capital disponible (USD)"
            htmlFor="calc-capital"
            value={capital}
            min={0}
            step="0.01"
            onChange={(value) => handleNumberChange(setCapital, value, 0)}
          />
          <Field
            label="Apalancamiento"
            htmlFor="calc-leverage"
            value={leverage}
            min={0}
            step="0.1"
            onChange={(value) => handleNumberChange(setLeverage, value, 1)}
          />
          <Field
            label="% de capital a usar"
            htmlFor="calc-percent"
            value={riskPercent}
            min={0}
            step="0.1"
            onChange={(value) => handleNumberChange(setRiskPercent, value, 1)}
          />
          <div className="flex flex-col justify-between rounded-lg border bg-muted/40 p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Posición nocional estimada</p>
              <p className="mt-2 text-2xl font-semibold">
                {Number.isFinite(notional)
                  ? notional.toLocaleString("es-ES", { style: "currency", currency: "USD" })
                  : "—"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Ajusta estos valores según el contexto y valida que el plan permita el tamaño sugerido.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-background/60 p-4">
          <p className="text-xs uppercase text-muted-foreground">Recordatorios según tu nivel</p>
          {guidance ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Nivel operativo:</span> {guidance.label}
              </li>
              <li>
                <span className="font-medium text-foreground">Apalancamiento guía:</span> {guidance.leverage}
              </li>
              <li>
                <span className="font-medium text-foreground">% capital recomendado:</span> {guidance.capital}
              </li>
              <li className="text-xs text-muted-foreground">{guidance.notes}</li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Configura tu plan para ver límites sugeridos de apalancamiento y capital.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  value,
  min,
  step,
  onChange
}: {
  label: string;
  htmlFor: string;
  value: number;
  min: number;
  step: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Input
        id={htmlFor}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

const levelGuidance: Record<
  "Nivel 1" | "Nivel 2" | "Nivel 3",
  { label: string; leverage: string; capital: string; notes: string }
> = {
  "Nivel 1": {
    label: "Nivel 1 · Riesgo conservador",
    leverage: "Apalancamiento base 1× – 5×",
    capital: "2% por trade, tamaño máximo 10% del capital",
    notes: "Foco en setups A, una operación a la vez y disciplina absoluta en stops."
  },
  "Nivel 2": {
    label: "Nivel 2 · Margen ampliado",
    leverage: "Puedes extender hasta 10× en oportunidades A+",
    capital: "Tamaño máximo 25% del capital, hasta dos operaciones simultáneas",
    notes: "Activa sólo tras 10 días verdes o 10 TPs; vigila drawdown para no retroceder."
  },
  "Nivel 3": {
    label: "Nivel 3 · Confianza plena",
    leverage: "En picos de convicción puedes llegar a 15×",
    capital: "Tamaño máximo 40% del capital por posición",
    notes: "Sigue sometido a la regla de -4 SL en 48 h; cualquier violación devuelve un nivel atrás."
  }
};

function normalizeLevel(level: string | null) {
  if (!level) return "Nivel 1";
  const matched = level.match(/\d/);
  if (!matched) return "Nivel 1";
  const index = Number(matched[0]);
  if (index === 2) return "Nivel 2";
  if (index >= 3) return "Nivel 3";
  return "Nivel 1";
}
