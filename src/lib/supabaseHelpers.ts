import { SUPABASE_CONFIGURED } from "@/integrations/supabase/client";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_CONFIGURED);
}

export function ensureSupabaseConfigured() {
  if (!SUPABASE_CONFIGURED) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  return true;
}
