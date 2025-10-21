'use client';

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const clientRef = React.useRef(getQueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={clientRef.current}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
