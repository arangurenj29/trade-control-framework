'use client';

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Supabase client not initialised: define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    throw new Error("Supabase client misconfigured");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
