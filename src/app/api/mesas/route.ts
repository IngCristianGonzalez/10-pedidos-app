import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { mapMesa, toMesaRow } from "@/lib/supabase";

const MesaSchema = z.object({
  id: z.string().min(1),
  numero: z.string().min(1).max(10),
  estado: z.enum(["disponible", "ocupada", "reservada"]),
  capacidad: z.number().int().min(1).max(100),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  patch: z
    .object({
      numero: z.string().min(1).max(10).optional(),
      estado: z.enum(["disponible", "ocupada", "reservada"]).optional(),
      capacidad: z.number().int().min(1).max(100).optional(),
    })
    .refine((o) => Object.keys(o).length > 0, { message: "patch vacío" }),
});

function noConfig() {
  return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
}

export async function POST(req: Request) {
  if (!isAdminConfigured) return noConfig();
  try {
    const parsed = MesaSchema.parse(await req.json());
    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await sb
      .from("mesas")
      .insert(toMesaRow({ ...parsed, pedidoActivoIds: [], updatedAt: now }))
      .select("*")
      .single();
    if (error || !data) return NextResponse.json({ ok: false, error: "No se pudo crear" }, { status: 500 });
    return NextResponse.json({ ok: true, data: mapMesa(data as Parameters<typeof mapMesa>[0]) }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isAdminConfigured) return noConfig();
  try {
    const parsed = PatchSchema.parse(await req.json());
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("mesas")
      .update({ ...parsed.patch, updated_at: new Date().toISOString() })
      .eq("id", parsed.id)
      .select("*")
      .single();
    if (error || !data) return NextResponse.json({ ok: false, error: "No se pudo actualizar" }, { status: 500 });
    return NextResponse.json({ ok: true, data: mapMesa(data as Parameters<typeof mapMesa>[0]) });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdminConfigured) return noConfig();
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("mesas").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "No se pudo eliminar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
