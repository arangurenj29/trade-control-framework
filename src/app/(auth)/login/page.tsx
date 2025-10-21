import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Trade Control Framework</h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesión con tu correo y contraseña.
          </p>
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          ¿Necesitas soporte? Contáctanos en <Link href="mailto:soporte@tradecontrol.ai" className="underline">soporte@tradecontrol.ai</Link>
        </div>
      </div>
    </div>
  );
}
