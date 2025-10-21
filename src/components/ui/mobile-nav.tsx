"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/ui/dashboard-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-full bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Link href="/dashboard" className="text-sm font-semibold" onClick={() => setOpen(false)}>
                Trade Control
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4" onClick={() => setOpen(false)}>
              <DashboardNav />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
