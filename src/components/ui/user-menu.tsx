import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSessionProfile } from "@/lib/auth";

export async function UserMenu() {
  const profile = await getSessionProfile();

  if (!profile) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">
        {profile.display_name ?? profile.email}
      </div>
      <form action="/logout" method="post">
        <Button size="sm" variant="outline">
          Salir
        </Button>
      </form>
    </div>
  );
}
