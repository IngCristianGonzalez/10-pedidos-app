import { NextResponse } from "next/server";
import { NEQUI_CONFIGURADO, consultarEstadoQRNequi } from "@/lib/nequi-server";

export async function GET(req: Request) {
  if (!NEQUI_CONFIGURADO) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const qrValue = searchParams.get("qrValue") || "";
  if (!qrValue) return NextResponse.json({ ok: false, error: "Falta qrValue" }, { status: 400 });
  try {
    const estado = await consultarEstadoQRNequi(qrValue);
    return NextResponse.json({ ok: true, data: { estado } });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message || "Error consultando estado" }, { status: 502 });
  }
}
