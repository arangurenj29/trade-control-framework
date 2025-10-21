"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { logDebug } from "@/lib/logger";

type Status = "idle" | "loading" | "success" | "error";
type Mode = "signin" | "signup";

export function LoginForm() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (mode === "signin") {
        await logDebug("auth:signin_attempt", { email });
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          await logDebug("auth:signin_error", { email, message: error.message });
          throw error;
        }

        setStatus("success");
        await logDebug("auth:signin_success", { email });
        router.push("/dashboard");
        router.refresh();
      } else {
        await logDebug("auth:signup_attempt", { email });
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) {
          await logDebug("auth:signup_error", { email, message: error.message });
          throw error;
        }

        const identities = data?.user?.identities ?? [];
        if (identities.length === 0) {
          setStatus("error");
          setErrorMessage(
            "Este correo ya está registrado. Inicia sesión con tu contraseña o restablécela desde Supabase."
          );
          setMode("signin");
          await logDebug("auth:signup_existing", { email });
          return;
        }

        setStatus("success");
        setInfoMessage("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.");
        await logDebug("auth:signup_success", { email });
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage((error as Error).message);
      await logDebug("auth:generic_error", { email, message: (error as Error).message });
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage("Introduce tu correo para enviar el enlace de recuperación.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    setInfoMessage(null);

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      await logDebug("auth:reset_error", { email, message: error.message });
      return;
    }

    setStatus("success");
    setInfoMessage("Si el correo existe, te enviamos instrucciones para restablecer la contraseña.");
    await logDebug("auth:reset_requested", { email });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" requiredIndicator>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" requiredIndicator>
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </div>

      <Button type="submit" disabled={status === "loading"} className="w-full">
        {status === "loading"
          ? "Procesando..."
          : mode === "signin"
            ? "Iniciar sesión"
            : "Crear cuenta"}
      </Button>

      {infoMessage ? <p className="text-sm text-emerald-600">{infoMessage}</p> : null}

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      {mode === "signin" ? (
        <div className="text-right">
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={handleResetPassword}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      ) : null}

      <div className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            ¿Aún no tienes cuenta?{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setMode("signup");
                setStatus("idle");
                setErrorMessage(null);
                setInfoMessage(null);
              }}
            >
              Crear cuenta
            </button>
          </>
        ) : (
          <>
            ¿Ya estás registrado?{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setMode("signin");
                setStatus("idle");
                setErrorMessage(null);
                setInfoMessage(null);
              }}
            >
              Inicia sesión
            </button>
          </>
        )}
      </div>
    </form>
  );
}
