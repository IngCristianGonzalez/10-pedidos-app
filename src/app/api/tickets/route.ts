import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { mapTicket } from "@/lib/supabase";

const BodySchema = z.object({
  id: z.string().min(1),
  impresoEn: z.string().optional(),
  reimpresiones: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const parsed = BodySchema.parse(await req.json());
    const row: Record<string, unknown> = {};
    if (parsed.impresoEn !== undefined) row.impreso_en = parsed.impresoEn;
    if (parsed.reimpresiones !== undefined) row.reimpresiones = parsed.reimpresiones;
    if (Object.keys(row).length === 0) return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from("tickets_cocina").update(row).eq("id", parsed.id).select("*").single();
    if (error || !data) return NextResponse.json({ ok: false, error: "No se pudo actualizar" }, { status: 500 });
    return NextResponse.json({ ok: true, data: mapTicket(data as Parameters<typeof mapTicket>[0]) });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Error" }, { status: 500 });
  }
}
