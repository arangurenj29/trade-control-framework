import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (data) {
    return data;
  }

  const defaultProfile = {
    id: user.id,
    email: user.email ?? "",
    display_name: user.user_metadata?.full_name ?? null,
    timezone: user.user_metadata?.timezone ?? "America/New_York"
  } satisfies Partial<Profile> & { id: string; email: string };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .upsert(defaultProfile, { onConflict: "id" })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

export async function requireSessionProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

export async function requireSessionProfileOr404(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) {
    notFound();
  }
  return profile;
}
