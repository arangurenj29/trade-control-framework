import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { env } from "@/lib/env";

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...(options ?? {}) });
        } catch (error) {
          if (process.env.DEBUG_LOGS === "true") {
            console.warn("[Supabase] cookie set skipped:", (error as Error).message);
          }
        }
      },
      remove(name: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: "", ...(options ?? {}) });
        } catch (error) {
          if (process.env.DEBUG_LOGS === "true") {
            console.warn("[Supabase] cookie remove skipped:", (error as Error).message);
          }
        }
      }
    }
  });
}

export function createAdminSupabaseClient() {
  const key = env.supabaseServiceRoleKey || env.supabaseAnonKey;
  return createClient<Database>(env.supabaseUrl, key, {
    global: {
      headers: {
        "X-Client-Info": "trade-control-framework-admin"
      }
    }
  });
}

export function getUserIdFromHeaders() {
  const userId = headers().get("x-user-id");
  return userId ?? null;
}
