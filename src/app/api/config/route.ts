import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

const BodySchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("transferencia"),
    datos: z.object({
      titular: z.string().min(1).max(120),
      nequi: z.string().min(1).max(40),
      bancolombia: z.string().max(80),
      mensaje: z.string().max(500),
      qrImage: z.string().max(1_000_000),
    }),
  }),
  z.object({
    tipo: z.literal("horario"),
    datos: z.object({
      horarios: z.array(
        z.object({ dia: z.number().int().min(0).max(6), abre: z.string(), cierra: z.string(), activo: z.boolean() })
      ),
      cerradoTemporal: z.boolean(),
      mensajeCerrado: z.string().max(500),
    }),
  }),
]);

export async function PATCH(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const parsed = BodySchema.parse(await req.json());
    const sb = getSupabaseAdmin();
    if (parsed.tipo === "transferencia") {
      const d = parsed.datos;
      const { error } = await sb.from("negocio_config").upsert(
        {
          id: "gigi",
          titular: d.titular,
          nequi: d.nequi,
          bancolombia: d.bancolombia,
          mensaje: d.mensaje,
          qr_image: d.qrImage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (error) return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
    } else {
      const d = parsed.datos;
      const { error } = await sb.from("negocio_horario").upsert(
        {
          id: "gigi",
          horarios: d.horarios,
          cerrado_temporal: d.cerradoTemporal,
          mensaje_cerrado: d.mensajeCerrado,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (error) return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Error" }, { status: 500 });
  }
}
