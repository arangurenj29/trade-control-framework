import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { env } from "@/lib/env";

let warnedSet = false;
let warnedRemove = false;

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
          if (!warnedSet) {
            console.warn("[Supabase] cookie set skipped:", (error as Error).message);
            warnedSet = true;
          }
        }
      },
      remove(name: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: "", ...(options ?? {}) });
        } catch (error) {
          if (!warnedRemove) {
            console.warn("[Supabase] cookie remove skipped:", (error as Error).message);
            warnedRemove = true;
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
