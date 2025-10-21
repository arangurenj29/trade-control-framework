"use client";

import * as React from "react";

export function InfoBadge({
  label,
  tooltip
}: {
  label: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center gap-1">
      {label}
      {tooltip ? (
        <span className="group relative inline-flex">
          <button
            type="button"
            className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[0.6rem] text-muted-foreground focus:outline-none"
          >
            i
          </button>
          <span className="pointer-events-none absolute left-1/2 top-full z-40 hidden w-64 -translate-x-1/2 translate-y-2 rounded-md border bg-background p-3 text-left text-xs text-muted-foreground shadow-lg group-hover:block group-focus-within:block">
            {tooltip}
          </span>
        </span>
      ) : null}
    </span>
  );
}
