'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { logDebug } from "@/lib/logger";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(async ({ error }) => {
          if (error) {
            setMessage(error.message);
            await logDebug("auth:reset_exchange_error", { message: error.message });
          } else {
            await logDebug("auth:reset_exchange_success", {});
          }
        })
        .catch(async (error) => {
          setMessage((error as Error).message);
          await logDebug("auth:reset_exchange_error", { message: (error as Error).message });
        });
      return;
    }

    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(async ({ error }) => {
            if (error) {
              setMessage(error.message);
              await logDebug("auth:reset_session_error", { message: error.message });
            } else {
              await logDebug("auth:reset_session_success", {});
            }
          });
      }
    }
  }, [searchParams, supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    if (password.length < 8) {
      setStatus("error");
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      await logDebug("auth:reset_update_error", { message: error.message });
      return;
    }

    setStatus("success");
    setMessage("Contraseña actualizada. Ahora puedes iniciar sesión.");
    await logDebug("auth:reset_update_success", {});
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Define una nueva contraseña para tu cuenta.
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password" requiredIndicator>
              Nueva contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" requiredIndicator>
              Confirmar contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Actualizando..." : "Guardar contraseña"}
          </Button>
        </form>
        {message ? (
          <p
            className={`mt-4 text-center text-sm ${
              status === "error" ? "text-destructive" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
