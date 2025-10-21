import { Suspense } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import { UserMenu } from "@/components/ui/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/ui/mobile-nav";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link href="/dashboard" className="font-semibold">
              Trade Control Framework
            </Link>
          </div>
          <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <div className="container flex flex-1 gap-8 py-6">
        <aside className="hidden w-64 flex-shrink-0 md:block">
          <DashboardNav />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
