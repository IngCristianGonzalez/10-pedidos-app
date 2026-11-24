import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { mapMesa, mapPedido, mapTicket, toPedidoRow, toTicketRow, type MesaRow } from "@/lib/supabase";

const ItemSchema = z.object({
  productoId: z.string().min(1),
  nombre: z.string().min(1),
  precio: z.number().int().nonnegative(),
  cantidad: z.number().int().positive(),
});

const BodySchema = z.object({
  mesa: z.string().min(1).max(10), // número de mesa
  items: z.array(ItemSchema).min(1).max(50),
  notas: z.string().max(500).optional().default(""),
  creadoPor: z.string().max(60).optional().default("api"),
  esQr: z.boolean().optional().default(false),
});

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const sb = getSupabaseAdmin();

    const { data: mesaRow, error: mesaErr } = await sb.from("mesas").select("*").eq("numero", parsed.mesa).single();
    if (mesaErr || !mesaRow) return NextResponse.json({ ok: false, error: "Mesa no existe" }, { status: 404 });
    const mesa = mapMesa(mesaRow as unknown as MesaRow);

    // Totales calculados en servidor (no se confía en el cliente)
    const items = parsed.items.map((i) => ({ ...i, subtotal: i.precio * i.cantidad }));
    const total = items.reduce((a, i) => a + i.subtotal, 0);
    const now = new Date().toISOString();
    const pedidoId = uid("PED-");
    const ticketId = uid("TK-");

    const pedidoRow = toPedidoRow({
      id: pedidoId,
      mesa: mesa.numero,
      mesaId: mesa.id,
      items,
      estado: "pendiente",
      total,
      notas: parsed.notas,
      medioPago: null,
      creadoPor: parsed.creadoPor,
      esQr: parsed.esQr,
      ticketCocinaId: ticketId,
      facturaId: null,
      createdAt: now,
      updatedAt: now,
    });
    const { error: pErr } = await sb.from("pedidos").insert(pedidoRow);
    if (pErr) return NextResponse.json({ ok: false, error: "No se pudo crear el pedido" }, { status: 500 });

    const ticketRow = toTicketRow({
      id: ticketId,
      pedidoId,
      mesaId: mesa.id,
      numeroMesa: mesa.numero,
      items,
      notas: parsed.notas,
      impresoEn: null,
      reimpresiones: 0,
      createdAt: now,
    });
    await sb.from("tickets_cocina").insert(ticketRow);

    // Ocupa mesa
    const ids = [...mesa.pedidoActivoIds, pedidoId];
    await sb.from("mesas").update({ estado: "ocupada", pedido_activo_ids: ids, updated_at: now }).eq("id", mesa.id);

    const { data: created } = await sb.from("pedidos").select("*").eq("id", pedidoId).single();
    const { data: createdTicket } = await sb.from("tickets_cocina").select("*").eq("id", ticketId).single();
    return NextResponse.json(
      { ok: true, data: { pedido: mapPedido(created as Parameters<typeof mapPedido>[0]), ticket: createdTicket ? mapTicket(createdTicket as Parameters<typeof mapTicket>[0]) : null } },
      { status: 201 }
    );
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Error creando pedido" }, { status: 500 });
  }
}
