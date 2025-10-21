"use client";

import * as React from "react";
import { useFormState } from "react-dom";
import {
  deleteBybitConnectionAction,
  pauseBybitConnectionAction,
  resumeBybitConnectionAction,
  syncBybitTradesAction,
  type BybitConnectionActionState,
  type SyncBybitActionState,
  upsertBybitConnectionAction
} from "@/lib/actions/bybit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const initialFormState: BybitConnectionActionState = { status: "idle" };

export type BybitConnectionCardProps = {
  connection: {
    id: string;
    status: string;
    last_synced_at: string | null;
    last_error: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  processedCount: number;
  syncWindowDays: number;
};

export function BybitConnectionCard({
  connection,
  processedCount,
  syncWindowDays
}: BybitConnectionCardProps) {
  const [formState, formAction] = useFormState(upsertBybitConnectionAction, initialFormState);
  const [syncState, setSyncState] = React.useState<SyncBybitActionState>({ status: "idle" });
  const [isMutating, startMutation] = React.useTransition();
  const [isSyncing, startSync] = React.useTransition();

  const isConnected = Boolean(connection);
  const statusLabel =
    connection?.status === "active"
      ? { label: "Activa", className: "bg-emerald-500 text-white" }
      : connection?.status === "paused"
        ? { label: "Pausada", className: "bg-amber-500 text-black" }
        : { label: "Sin configurar", className: "bg-secondary text-secondary-foreground" };

  const handleSync = () => {
    startSync(async () => {
      setSyncState({ status: "idle" });
      const result = await syncBybitTradesAction();
      setSyncState(result);
    });
  };

  const handlePause = () => {
    startMutation(async () => {
      await pauseBybitConnectionAction();
    });
  };

  const handleResume = () => {
    startMutation(async () => {
      await resumeBybitConnectionAction();
    });
  };

  const handleDelete = () => {
    if (!confirm("¿Eliminar la conexión con Bybit? Esta acción no borra los trades ya importados.")) {
      return;
    }
    startMutation(async () => {
      await deleteBybitConnectionAction();
    });
  };

  const renderStatusMessage = () => {
    if (formState.status === "error") {
      return <p className="text-sm text-destructive">{formState.message}</p>;
    }
    if (formState.status === "success") {
      return <p className="text-sm text-emerald-600">{formState.message}</p>;
    }
    if (syncState.status === "error") {
      return <p className="text-sm text-destructive">{syncState.message}</p>;
    }
    if (syncState.status === "success") {
      return (
        <p className="text-sm text-muted-foreground">{syncState.message}</p>
      );
    }
    if (connection?.last_error) {
      return <p className="text-sm text-destructive">Último error: {connection.last_error}</p>;
    }
    if (connection?.last_synced_at) {
      return (
        <p className="text-sm text-muted-foreground">
          Última sincronización {formatTimestamp(connection.last_synced_at)}.
        </p>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Bybit</CardTitle>
          <Badge className={statusLabel.className}>{statusLabel.label}</Badge>
        </div>
        <CardDescription>
          Sincroniza tus fills de los últimos {syncWindowDays} días y consérvalos en Supabase para futuras métricas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key" requiredIndicator>
              API Key
            </Label>
            <Input id="api_key" name="api_key" type="text" placeholder="bybit_api_key" autoComplete="off" />
            {isConnected ? (
              <p className="text-xs text-muted-foreground">Deja vacío para conservar la clave actual.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="api_secret" requiredIndicator>
              API Secret
            </Label>
            <Input
              id="api_secret"
              name="api_secret"
              type="password"
              placeholder="bybit_api_secret"
              autoComplete="off"
            />
            {isConnected ? (
              <p className="text-xs text-muted-foreground">Deja vacío para conservar el secret actual.</p>
            ) : null}
          </div>
          <Button type="submit" disabled={isMutating || isSyncing}>
            {isConnected ? "Actualizar credenciales" : "Conectar Bybit"}
          </Button>
          {renderStatusMessage()}
        </form>

        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <p className="font-semibold text-foreground">Resumen</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              Trades procesados: <span className="font-medium text-foreground">{processedCount}</span>
            </li>
            <li>Ventana de sincronización: {syncWindowDays} días hacia atrás.</li>
            {connection?.created_at ? (
              <li>Conectado desde: {formatTimestamp(connection.created_at)}</li>
            ) : null}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!isConnected || isMutating || isSyncing} onClick={handleSync}>
          {isSyncing ? "Sincronizando..." : "Sincronizar fills"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!isConnected || isMutating || isSyncing}
          onClick={connection?.status === "active" ? handlePause : handleResume}
        >
          {connection?.status === "active" ? "Pausar" : "Reactivar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!isConnected || isMutating || isSyncing}
          onClick={handleDelete}
        >
          Eliminar conexión
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "nunca";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}
