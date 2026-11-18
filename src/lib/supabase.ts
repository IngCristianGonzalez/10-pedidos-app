import { createClient } from "@supabase/supabase-js";
import type { Producto, Mesa, Pedido, TicketCocina, Factura } from "@/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase = isSupabaseConfigured ? createClient(url!, anon!) : null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase no configurado usando localStorage fallback. Define NEXT_PUBLIC_SUPABASE_URL y ANON_KEY en Render env.");
    return null;
  }
  return supabase;
}

// ----- Row types (snake_case = DB) -----
export type MesaRow = {
  id: string;
  numero: string;
  estado: string;
  capacidad: number;
  pedido_activo_ids: string[];
  updated_at: string;
};
export type ProductoRow = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible: boolean;
  created_at: string;
};
export type PedidoRow = {
  id: string;
  mesa: string;
  mesa_id: string | null;
  items: unknown;
  estado: string;
  total: number;
  notas: string | null;
  medio_pago: string | null;
  creado_por: string | null;
  es_qr: boolean | null;
  ticket_cocina_id: string | null;
  factura_id: string | null;
  created_at: string;
  updated_at: string;
};
export type TicketRow = {
  id: string;
  pedido_id: string;
  mesa_id: string | null;
  numero_mesa: string;
  items: unknown;
  notas: string | null;
  impreso_en: string | null;
  reimpresiones: number | null;
  created_at: string;
};
export type FacturaRow = {
  id: string;
  consecutivo: string;
  pedido_id: string;
  mesa_id: string | null;
  numero_mesa: string;
  items: unknown;
  subtotal: number;
  iva_incluido: number;
  total: number;
  medio_pago: string | null;
  created_at: string;
  impreso: boolean | null;
};

// ----- Mappers DB -> App -----
export function mapMesa(row: MesaRow): Mesa {
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado as Mesa["estado"],
    capacidad: row.capacidad,
    pedidoActivoIds: (row.pedido_activo_ids as string[]) ?? [],
    updatedAt: row.updated_at,
  };
}
export function mapProducto(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio,
    categoria: row.categoria as Producto["categoria"],
    imagen: row.imagen,
    disponible: row.disponible,
    createdAt: row.created_at,
  };
}
export function mapPedido(row: PedidoRow): Pedido {
  return {
    id: row.id,
    mesa: row.mesa,
    mesaId: row.mesa_id,
    items: (row.items as Pedido["items"]) ?? [],
    estado: row.estado as Pedido["estado"],
    total: row.total,
    notas: row.notas ?? "",
    medioPago: (row.medio_pago as Pedido["medioPago"]) ?? null,
    creadoPor: row.creado_por ?? "",
    esQr: Boolean(row.es_qr),
    ticketCocinaId: row.ticket_cocina_id,
    facturaId: row.factura_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function mapTicket(row: TicketRow): TicketCocina {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    mesaId: row.mesa_id ?? "",
    numeroMesa: row.numero_mesa,
    items: (row.items as TicketCocina["items"]) ?? [],
    notas: row.notas ?? "",
    impresoEn: row.impreso_en,
    reimpresiones: row.reimpresiones ?? 0,
    createdAt: row.created_at,
  };
}
export function mapFactura(row: FacturaRow): Factura {
  return {
    id: row.id,
    consecutivo: row.consecutivo,
    pedidoId: row.pedido_id,
    mesaId: row.mesa_id ?? "",
    numeroMesa: row.numero_mesa,
    items: (row.items as Factura["items"]) ?? [],
    subtotal: row.subtotal,
    ivaIncluido: row.iva_incluido,
    total: row.total,
    medioPago: (row.medio_pago as Factura["medioPago"]) ?? null,
    createdAt: row.created_at,
    impreso: Boolean(row.impreso),
  };
}

// ----- Mappers App -> DB -----
export function toMesaRow(m: Mesa): MesaRow {
  return { id: m.id, numero: m.numero, estado: m.estado, capacidad: m.capacidad, pedido_activo_ids: m.pedidoActivoIds, updated_at: m.updatedAt };
}
export function toProductoRow(p: Producto): ProductoRow {
  return { id: p.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, categoria: p.categoria, imagen: p.imagen, disponible: p.disponible, created_at: p.createdAt };
}
export function toPedidoRow(p: Pedido): PedidoRow {
  return {
    id: p.id,
    mesa: p.mesa,
    mesa_id: p.mesaId,
    items: p.items as unknown,
    estado: p.estado,
    total: p.total,
    notas: p.notas,
    medio_pago: p.medioPago,
    creado_por: p.creadoPor,
    es_qr: p.esQr,
    ticket_cocina_id: p.ticketCocinaId,
    factura_id: p.facturaId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}
export function toTicketRow(t: TicketCocina): TicketRow {
  return {
    id: t.id,
    pedido_id: t.pedidoId,
    mesa_id: t.mesaId || null,
    numero_mesa: t.numeroMesa,
    items: t.items as unknown,
    notas: t.notas,
    impreso_en: t.impresoEn,
    reimpresiones: t.reimpresiones,
    created_at: t.createdAt,
  };
}
export function toFacturaRow(f: Factura): FacturaRow {
  return {
    id: f.id,
    consecutivo: f.consecutivo,
    pedido_id: f.pedidoId,
    mesa_id: f.mesaId || null,
    numero_mesa: f.numeroMesa,
    items: f.items as unknown,
    subtotal: f.subtotal,
    iva_incluido: f.ivaIncluido,
    total: f.total,
    medio_pago: f.medioPago,
    created_at: f.createdAt,
    impreso: f.impreso,
  };
}
