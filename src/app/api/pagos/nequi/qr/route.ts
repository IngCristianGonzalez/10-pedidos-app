import { NextResponse } from "next/server";
import { z } from "zod";
import { NEQUI_CONFIGURADO, generarQRNequi } from "@/lib/nequi-server";

const BodySchema = z.object({
  pedidoId: z.string().min(1).max(40),
  valor: z.number().int().positive().max(12_000_000),
});

export async function POST(req: Request) {
  if (!NEQUI_CONFIGURADO) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const qr = await generarQRNequi(parsed.valor, parsed.pedidoId);
    return NextResponse.json({ ok: true, data: qr });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: (e as Error).message || "Error generando QR" }, { status: 502 });
  }
}
