"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, NotebookPen, CandlestickChart, Sparkles, FileBarChart2, HeartPulse, Plug2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "Mi Plan", icon: NotebookPen },
  { href: "/trades", label: "Trades", icon: CandlestickChart },
  { href: "/bitacora", label: "Bitácora", icon: HeartPulse },
  { href: "/ascenso", label: "Ascenso", icon: Sparkles },
  { href: "/reportes", label: "Reportes", icon: FileBarChart2 },
  { href: "/integraciones", label: "Integraciones", icon: Plug2 }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
