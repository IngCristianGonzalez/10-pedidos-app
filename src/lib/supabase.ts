import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase = isSupabaseConfigured ? createClient(url!, anon!) : null;

// Helper para usar store local si no hay supabase, supabase si está configurado
export function getSupabase() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase no configurado — usando localStorage fallback. Define NEXT_PUBLIC_SUPABASE_URL y ANON_KEY en Render env.");
    return null;
  }
  return supabase;
}
