"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const MOTIVATION_MESSAGES = [
  "Recuerda: proteger tu capital es tu primera victoria.",
  "Cuando la emoción sube, baja el tamaño de tu posición.",
  "Disciplina hoy, libertad mañana.",
  "Una operación menos también es un trade ganado.",
  "Opera tu plan, no tu estado de ánimo.",
  "Respira, revisa, ejecuta sin prisa.",
  "El stop sustentado es tu seguro de continuidad.",
  "El mercado no se va; tú decide cuándo entrar.",
  "Evalúa el riesgo antes de imaginar la recompensa.",
  "Cada cierre disciplinado suma XP invisible.",
  "Tu ventaja está en la paciencia, no en la velocidad.",
  "Un trade perfecto comienza con una mente centrada.",
  "La consistencia se construye con una decisión a la vez.",
  "No persigas al precio; espera que llegue a tu zona.",
  "Repite lo que funciona, registra lo que aprendes.",
  "El control emocional es tu edge más valioso.",
  "Pierdes cuando improvisas, ganas cuando sigues el proceso.",
  "No necesitas operar hoy para ganar el mes.",
  "Cerrar la plataforma también es un movimiento profesional.",
  "Enfócate en la ejecución, el resultado es consecuencia."
] as const;

type MotivationTickerProps = {
  className?: string;
};

export function MotivationTicker({ className }: MotivationTickerProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    setIndex(Math.floor(Math.random() * MOTIVATION_MESSAGES.length));
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MOTIVATION_MESSAGES.length);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className={cn("text-sm font-medium text-muted-foreground", className)}
      aria-live="polite"
      role="status"
    >
      {MOTIVATION_MESSAGES[index]}
    </p>
  );
}
