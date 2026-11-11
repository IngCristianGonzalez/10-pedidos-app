import { NextResponse } from "next/server";
import { z } from "zod";
import { PEDIDOS_MOCK } from "@/lib/mock-data";

// In-memory store for API (local, resets on restart). For MVP local.
// En prod con Supabase esto migrara a supabase-js.
// eslint-disable-next-line prefer-const
let pedidos = [...PEDIDOS_MOCK];

const DetalleSchema = z.object({
  productoId: z.string(),
  nombre: z.string(),
  precio: z.number().nonnegative(),
  cantidad: z.number().int().positive(),
  subtotal: z.number().nonnegative(),
});

const CreateSchema = z.object({
  mesa: z.string().min(1),
  items: z.array(DetalleSchema).min(1),
  notas: z.string().optional().default(""),
  creadoPor: z.string().optional(),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  estado: z.enum(["pendiente", "en_preparacion", "listo", "entregado", "pagado", "cancelado"]).optional(),
  medioPago: z.enum(["efectivo", "transferencia"]).nullable().optional(),
});

export async function GET() {
  return NextResponse.json({ ok: true, count: pedidos.length, data: pedidos });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateSchema.parse(body);
    const total = parsed.items.reduce((a, i) => a + i.subtotal, 0);
    const nuevo = {
      id: `PED-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString(36).toUpperCase().slice(-3)}`,
      mesa: parsed.mesa,
      items: parsed.items,
      estado: "pendiente" as const,
      total,
      notas: parsed.notas || "",
      medioPago: null,
      creadoPor: parsed.creadoPor || "api",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pedidos.unshift(nuevo);
    return NextResponse.json({ ok: true, data: nuevo }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.issues }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = PatchSchema.parse(body);
    const idx = pedidos.findIndex((p) => p.id === parsed.id);
    if (idx === -1) return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    const prev = pedidos[idx];
    const updated = {
      ...prev,
      estado: (parsed.estado as typeof prev.estado) || prev.estado,
      medioPago: parsed.medioPago !== undefined ? parsed.medioPago : prev.medioPago,
      updatedAt: new Date().toISOString(),
    };
    pedidos[idx] = updated;
    return NextResponse.json({ ok: true, data: updated });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: e.issues }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
}
