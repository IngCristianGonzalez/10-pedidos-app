import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { esTransicionValida } from "@/lib/pedidos-transiciones";
import {
  mapFactura,
  mapMesa,
  mapPedido,
  toFacturaRow,
  type FacturaRow,
  type MesaRow,
  type PedidoRow,
} from "@/lib/supabase";
import type { EstadoPedido, MedioPago } from "@/types";

const BodySchema = z.object({
  id: z.string().min(1),
  estado: z.enum(["pendiente", "en_preparacion", "listo", "entregado", "pagado", "cancelado"]),
  medioPago: z.enum(["efectivo", "transferencia"]).nullable().optional(),
  notaRef: z.string().max(200).optional().default(""),
  crearFactura: z.boolean().optional().default(false),
});

async function siguienteConsecutivo(sb: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const { count } = await sb.from("facturas").select("id", { count: "exact", head: true });
    const consecutivo = `FAC-${String((count ?? 0) + 1 + i).padStart(6, "0")}`;
    const { data } = await sb.from("facturas").select("id").eq("consecutivo", consecutivo).maybeSingle();
    if (!data) return consecutivo;
  }
  return `FAC-${Date.now().toString(36).toUpperCase()}`;
}

export async function PATCH(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const parsed = BodySchema.parse(await req.json());
    const sb = getSupabaseAdmin();

    const { data: prevRow, error: prevErr } = await sb.from("pedidos").select("*").eq("id", parsed.id).single();
    if (prevErr || !prevRow) return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    const prev = mapPedido(prevRow as unknown as PedidoRow);
    const next = parsed.estado as EstadoPedido;

    if (!esTransicionValida(prev.estado, next)) {
      return NextResponse.json({ ok: false, error: `Transición ${prev.estado} → ${next} no permitida` }, { status: 422 });
    }

    const medioPago = (parsed.medioPago !== undefined ? parsed.medioPago : prev.medioPago) as MedioPago;
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { estado: next, medio_pago: medioPago, updated_at: now };
    if (parsed.notaRef) update.notas = `${prev.notas || ""}${parsed.notaRef}`.slice(0, 500);

    // Factura generada en servidor: prepago por transferencia o cobro final.
    // Nunca se confía en totales o consecutivos enviados por el cliente.
    let factura: FacturaRow | null = null;
    if (parsed.crearFactura) {
      const esPrepago = next === "en_preparacion" && medioPago === "transferencia";
      const esCobroFinal = next === "pagado";
      if (!esPrepago && !esCobroFinal) {
        return NextResponse.json({ ok: false, error: "Factura auto solo para prepago o cobro final" }, { status: 422 });
      }
      if (prev.facturaId) {
        return NextResponse.json({ ok: false, error: "El pedido ya tiene factura" }, { status: 409 });
      }
      const subtotal = Math.round(prev.total / 1.19);
      const facturaId = `FACID-${Date.now()}`;
      const row = toFacturaRow({
        id: facturaId,
        consecutivo: await siguienteConsecutivo(sb),
        pedidoId: prev.id,
        mesaId: prev.mesaId || "",
        numeroMesa: prev.mesa,
        items: prev.items,
        subtotal,
        ivaIncluido: prev.total - subtotal,
        total: prev.total,
        medioPago: medioPago ?? "transferencia",
        createdAt: now,
        impreso: false,
      });
      const { error: fErr } = await sb.from("facturas").insert(row);
      if (fErr) return NextResponse.json({ ok: false, error: "No se pudo generar la factura" }, { status: 500 });
      update.factura_id = facturaId;
      factura = row;
    }

    const { data: updated, error: uErr } = await sb
      .from("pedidos")
      .update(update)
      .eq("id", prev.id)
      .select("*")
      .single();
    if (uErr || !updated) return NextResponse.json({ ok: false, error: "No se pudo actualizar" }, { status: 500 });

    // Al pagar o cancelar se libera la mesa si no quedan activos
    if ((next === "pagado" || next === "cancelado") && prev.mesaId) {
      const { data: mesaRow } = await sb.from("mesas").select("*").eq("id", prev.mesaId).single();
      if (mesaRow) {
        const mesa = mapMesa(mesaRow as unknown as MesaRow);
        const restantes = mesa.pedidoActivoIds.filter((x) => x !== prev.id);
        await sb
          .from("mesas")
          .update({
            pedido_activo_ids: restantes,
            estado: restantes.length === 0 ? "disponible" : mesa.estado,
            updated_at: now,
          })
          .eq("id", mesa.id);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        pedido: mapPedido(updated as unknown as PedidoRow),
        factura: factura ? mapFactura(factura as unknown as FacturaRow) : null,
      },
    });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ ok: false, error: "Error actualizando pedido" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdminConfigured) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { data: prevRow } = await sb.from("pedidos").select("*").eq("id", id).single();
    const prev = prevRow ? mapPedido(prevRow as unknown as PedidoRow) : null;
    const { error } = await sb.from("pedidos").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: "No se pudo eliminar" }, { status: 500 });
    if (prev?.mesaId) {
      const { data: mesaRow } = await sb.from("mesas").select("*").eq("id", prev.mesaId).single();
      if (mesaRow) {
        const mesa = mapMesa(mesaRow as unknown as MesaRow);
        const restantes = mesa.pedidoActivoIds.filter((x) => x !== id);
        await sb
          .from("mesas")
          .update({
            pedido_activo_ids: restantes,
            estado: restantes.length === 0 ? "disponible" : mesa.estado,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mesa.id);
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Error eliminando" }, { status: 500 });
  }
}
