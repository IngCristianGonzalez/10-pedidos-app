import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { mapProducto, toProductoRow } from "@/lib/supabase";

const ProductoSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(500).default(""),
  precio: z.number().int().nonnegative().max(10_000_000),
  categoria: z.enum(["papas", "hamburguesas", "perros", "salchipapas", "bebidas", "combos", "otros"]),
  imagen: z.string().max(2000).default(""),
  disponible: z.boolean(),
  createdAt: z.string().optional(),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  patch: z
    .object({
      nombre: z.string().min(1).max(120).optional(),
      descripcion: z.string().max(500).optional(),
      precio: z.number().int().nonnegative().max(10_000_000).optional(),
      categoria: z.enum(["papas", "hamburguesas", "perros", "salchipapas", "bebidas", "combos", "otros"]).optional(),
      imagen: z.string().max(2000).optional(),
      disponible: z.boolean().optional(),
    })
    .refine((o) => Object.keys(o).length > 0, { message: "patch vacío" }),
});

function noConfig() {
  return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
}

export async function POST(req: Request) {
  if (!isAdminConfigured) return noConfig();
  try {
    const parsed = ProductoSchema.parse(await req.json());
    const sb = getSupabaseAdmin();
    const row = toProductoRow({ ...parsed, createdAt: parsed.createdAt || new Date().toISOString() });
    const { data, error } = await sb.from("productos").insert(row).select("*").single();
    if (error || !data) return NextResponse.json({ ok: false, error: "No se pudo crear" }, { status: 500 });
    return NextResponse.json({ ok: true, data: mapProducto(data as Parameters<typeof mapProducto>[0]) }, { status: 201 });
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
    const { data, error } = await sb.from("productos").update(parsed.patch).eq("id", parsed.id).select("*").single();
    if (error || !data) return NextResponse.json({ ok: false, error: "No se pudo actualizar" }, { status: 500 });
    return NextResponse.json({ ok: true, data: mapProducto(data as Parameters<typeof mapProducto>[0]) });
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
  const { error } = await sb.from("productos").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "No se pudo eliminar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
