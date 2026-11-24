import { NextResponse } from "next/server";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

// Sube el QR de Nequi al bucket compartido. Solo el servidor tiene permiso
// de escritura (service_role); la key anónima es solo-lectura.
export async function POST(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const form = await req.formData();
    const file = form.get("qr");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Falta archivo qr" }, { status: 400 });
    if (file.size > 3 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Máximo 3MB" }, { status: 413 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ ok: false, error: "Debe ser imagen" }, { status: 415 });

    const sb = getSupabaseAdmin();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await sb.storage
      .from("negocio")
      .upload("nequi-qr.jpeg", buf, { upsert: true, cacheControl: "0", contentType: file.type });
    if (error) return NextResponse.json({ ok: false, error: "No se pudo subir" }, { status: 500 });
    const { data } = sb.storage.from("negocio").getPublicUrl("nequi-qr.jpeg");
    return NextResponse.json({ ok: true, data: { url: `${data.publicUrl}?t=${Date.now()}` } });
  } catch {
    return NextResponse.json({ ok: false, error: "Error subiendo QR" }, { status: 500 });
  }
}
