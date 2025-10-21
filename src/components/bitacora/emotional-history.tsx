import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EmotionalLog } from "@/lib/dto";

export function EmotionalHistory({ entries }: { entries: EmotionalLog[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no has registrado tu bitácora emocional.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-left text-xs md:text-sm">
        <thead className="bg-muted text-foreground">
          <tr>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Antes</th>
            <th className="px-3 py-2">Después</th>
            <th className="px-3 py-2">Confianza</th>
            <th className="px-3 py-2">Cansancio</th>
            <th className="px-3 py-2">Claridad</th>
            <th className="px-3 py-2">Emoción</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-3 py-2">
                {format(new Date(entry.log_date), "PP", { locale: es })}
              </td>
              <td className="px-3 py-2">{entry.estado_antes}/5</td>
              <td className="px-3 py-2">{entry.estado_despues}/5</td>
              <td className="px-3 py-2">{entry.confianza}/5</td>
              <td className="px-3 py-2">{entry.cansancio}/5</td>
              <td className="px-3 py-2">{entry.claridad}/5</td>
              <td className="px-3 py-2">{entry.emocion_dominante ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
