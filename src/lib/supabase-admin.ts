// SOLO SERVIDOR — service_role, nunca importar desde componentes cliente.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminConfigured = Boolean(url && serviceKey);

// any: sin tipos generados de la DB; las rutas validan con zod antes de escribir.
/* eslint-disable @typescript-eslint/no-explicit-any */
let admin: SupabaseClient<any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any> {
  if (!isAdminConfigured) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor");
  if (!admin) admin = createClient(url!, serviceKey!);
  return admin;
}
