"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Producto, Pedido, DetallePedido, Mesa, TicketCocina, Factura } from "@/types";
import { PRODUCTOS_MOCK, PEDIDOS_MOCK, MESAS_MOCK } from "./mock-data";
import {
  getSupabase,
  isSupabaseConfigured,
  mapMesa,
  mapProducto,
  mapPedido,
  mapTicket,
  mapFactura,
  toMesaRow,
  toProductoRow,
  toPedidoRow,
  toTicketRow,
  toFacturaRow,
} from "./supabase";

const STORAGE_PRODUCTOS = "gigi_productos";
const STORAGE_PEDIDOS = "gigi_pedidos";
const STORAGE_MESAS = "gigi_mesas";
const STORAGE_TICKETS = "gigi_tickets_cocina";
const STORAGE_FACTURAS = "gigi_facturas";

type StoreContextType = {
  productos: Producto[];
  pedidos: Pedido[];
  mesas: Mesa[];
  ticketsCocina: TicketCocina[];
  facturas: Factura[];
  hydrated: boolean;
  supabaseEnabled: boolean;
  addProducto: (p: Producto) => void;
  updateProducto: (id: string, data: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;
  addPedido: (pedido: Pedido) => void;
  updatePedido: (id: string, data: Partial<Pedido>) => void;
  deletePedido: (id: string) => void;
  addMesa: (m: Mesa) => void;
  updateMesa: (id: string, data: Partial<Mesa>) => void;
  deleteMesa: (id: string) => void;
  ocuparMesa: (mesaId: string, pedidoId: string) => void;
  liberarMesaSiVacia: (mesaId: string, pedidoId: string) => void;
  addTicketCocina: (t: TicketCocina) => void;
  updateTicketCocina: (id: string, data: Partial<TicketCocina>) => void;
  addFactura: (f: Factura) => void;
  resetMock: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

// helper: fire-and-forget supabase with error log accepts PromiseLike from supabase-js
function sbLog(p: PromiseLike<unknown>, ctx: string) {
  Promise.resolve(p as unknown as Promise<unknown>).then((res: unknown) => {
    const r = res as { error?: { message: string } | null };
    if (r?.error) console.error(`[Supabase] ${ctx}:`, r.error.message);
  }).catch((e) => console.error(`[Supabase] ${ctx}:`, e));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [pedidos, setPedidos] = useState<Pedido[]>(PEDIDOS_MOCK);
  const [mesas, setMesas] = useState<Mesa[]>(MESAS_MOCK);
  const [ticketsCocina, setTicketsCocina] = useState<TicketCocina[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Initial load: Supabase if configured, else localStorage
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const sb = getSupabase();
      if (sb && isSupabaseConfigured) {
        try {
          const [mesasRes, productosRes, pedidosRes, ticketsRes, facturasRes] = await Promise.all([
            sb.from("mesas").select("*").order("numero", { ascending: true }),
            sb.from("productos").select("*").order("created_at", { ascending: false }),
            sb.from("pedidos").select("*").order("created_at", { ascending: false }),
            sb.from("tickets_cocina").select("*").order("created_at", { ascending: false }),
            sb.from("facturas").select("*").order("created_at", { ascending: false }),
          ]);
          if (cancelled) return;
          if (mesasRes.error) console.error("[Supabase] mesas:", mesasRes.error.message);
          if (productosRes.error) console.error("[Supabase] productos:", productosRes.error.message);
          if (pedidosRes.error) console.error("[Supabase] pedidos:", pedidosRes.error.message);
          if (ticketsRes.error) console.error("[Supabase] tickets_cocina:", ticketsRes.error.message);
          if (facturasRes.error) console.error("[Supabase] facturas:", facturasRes.error.message);

          if (mesasRes.data && mesasRes.data.length > 0) setMesas(mesasRes.data.map((r: unknown) => mapMesa(r as Parameters<typeof mapMesa>[0])));
          // si mesas vacías en DB dejamos MESAS_MOCK (ya está)

          if (productosRes.data) {
            if (productosRes.data.length > 0) setProductos(productosRes.data.map((r: unknown) => mapProducto(r as Parameters<typeof mapProducto>[0])));
            else {
              // seed productos mock en DB si está vacía (first run)
              if (!productosRes.error) {
                const rows = PRODUCTOS_MOCK.map(toProductoRow);
                sbLog(sb.from("productos").upsert(rows, { onConflict: "id" }), "seed productos");
              }
            }
          }
          if (pedidosRes.data) setPedidos(pedidosRes.data.map((r: unknown) => mapPedido(r as Parameters<typeof mapPedido>[0])));
          if (ticketsRes.data) setTicketsCocina(ticketsRes.data.map((r: unknown) => mapTicket(r as Parameters<typeof mapTicket>[0])));
          if (facturasRes.data) setFacturas(facturasRes.data.map((r: unknown) => mapFactura(r as Parameters<typeof mapFactura>[0])));
        } catch (e) {
          console.error("[Supabase] load error, fallback localStorage:", e);
          fallbackLocal();
        }
      } else {
        fallbackLocal();
      }
      setHydrated(true);
    }
    function fallbackLocal() {
      try {
        const sp = localStorage.getItem(STORAGE_PRODUCTOS);
        const sd = localStorage.getItem(STORAGE_PEDIDOS);
        const sm = localStorage.getItem(STORAGE_MESAS);
        const st = localStorage.getItem(STORAGE_TICKETS);
        const sf = localStorage.getItem(STORAGE_FACTURAS);
        if (sp) setProductos(JSON.parse(sp));
        if (sd) setPedidos(JSON.parse(sd));
        if (sm) setMesas(JSON.parse(sm));
        if (st) setTicketsCocina(JSON.parse(st));
        if (sf) setFacturas(JSON.parse(sf));
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage siempre (offline cache), y Supabase ya está en cada mutación
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_PRODUCTOS, JSON.stringify(productos));
  }, [productos, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_PEDIDOS, JSON.stringify(pedidos));
  }, [pedidos, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_MESAS, JSON.stringify(mesas));
  }, [mesas, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_TICKETS, JSON.stringify(ticketsCocina));
  }, [ticketsCocina, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_FACTURAS, JSON.stringify(facturas));
  }, [facturas, hydrated]);

  const addProducto = (p: Producto) => {
    setProductos((prev) => [p, ...prev]);
    const sb = getSupabase();
    if (sb) sbLog(sb.from("productos").insert(toProductoRow(p)), "addProducto");
  };
  const updateProducto = (id: string, data: Partial<Producto>) => {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    const sb = getSupabase();
    if (sb) {
      const row: Record<string, unknown> = {};
      if (data.nombre !== undefined) row.nombre = data.nombre;
      if (data.descripcion !== undefined) row.descripcion = data.descripcion;
      if (data.precio !== undefined) row.precio = data.precio;
      if (data.categoria !== undefined) row.categoria = data.categoria;
      if (data.imagen !== undefined) row.imagen = data.imagen;
      if (data.disponible !== undefined) row.disponible = data.disponible;
      if (Object.keys(row).length) sbLog(sb.from("productos").update(row).eq("id", id), "updateProducto");
    }
  };
  const deleteProducto = (id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    const sb = getSupabase();
    if (sb) sbLog(sb.from("productos").delete().eq("id", id), "deleteProducto");
  };

  const addPedido = (pedido: Pedido) => {
    setPedidos((prev) => [pedido, ...prev]);
    const sb = getSupabase();
    if (sb) sbLog(sb.from("pedidos").insert(toPedidoRow(pedido)), "addPedido");
  };
  const updatePedido = (id: string, data: Partial<Pedido>) => {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)));
    const sb = getSupabase();
    if (sb) {
      const row: Record<string, unknown> = {};
      if (data.mesa !== undefined) row.mesa = data.mesa;
      if (data.mesaId !== undefined) row.mesa_id = data.mesaId;
      if (data.items !== undefined) row.items = data.items;
      if (data.estado !== undefined) row.estado = data.estado;
      if (data.total !== undefined) row.total = data.total;
      if (data.notas !== undefined) row.notas = data.notas;
      if (data.medioPago !== undefined) row.medio_pago = data.medioPago;
      if (data.esQr !== undefined) row.es_qr = data.esQr;
      if (data.ticketCocinaId !== undefined) row.ticket_cocina_id = data.ticketCocinaId;
      if (data.facturaId !== undefined) row.factura_id = data.facturaId;
      row.updated_at = new Date().toISOString();
      sbLog(sb.from("pedidos").update(row).eq("id", id), "updatePedido");
    }
  };
  const deletePedido = (id: string) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    const sb = getSupabase();
    if (sb) sbLog(sb.from("pedidos").delete().eq("id", id), "deletePedido");
  };

  const addMesa = (m: Mesa) => {
    setMesas((prev) => [...prev, m]);
    const sb = getSupabase();
    if (sb) sbLog(sb.from("mesas").insert(toMesaRow(m)), "addMesa");
  };
  const updateMesa = (id: string, data: Partial<Mesa>) => {
    setMesas((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m)));
    const sb = getSupabase();
    if (sb) {
      const row: Record<string, unknown> = {};
      if (data.numero !== undefined) row.numero = data.numero;
      if (data.estado !== undefined) row.estado = data.estado;
      if (data.capacidad !== undefined) row.capacidad = data.capacidad;
      if (data.pedidoActivoIds !== undefined) row.pedido_activo_ids = data.pedidoActivoIds;
      row.updated_at = new Date().toISOString();
      if (Object.keys(row).length > 1 || (Object.keys(row).length === 1 && !row.updated_at)) {
        sbLog(sb.from("mesas").update(row).eq("id", id), "updateMesa");
      } else if (data.pedidoActivoIds === undefined && data.estado === undefined && data.numero === undefined && data.capacidad === undefined) {
        // still update timestamp
        sbLog(sb.from("mesas").update({ updated_at: row.updated_at }).eq("id", id), "updateMesa touch");
      }
    }
  };
  const deleteMesa = (id: string) => {
    setMesas((prev) => prev.filter((m) => m.id !== id));
    const sb = getSupabase();
    if (sb) sbLog(sb.from("mesas").delete().eq("id", id), "deleteMesa");
  };
  const ocuparMesa = (mesaId: string, pedidoId: string) => {
    setMesas((prev) =>
      prev.map((m) => {
        if (m.id !== mesaId) return m;
        const next = { ...m, estado: "ocupada" as const, pedidoActivoIds: [...m.pedidoActivoIds, pedidoId], updatedAt: new Date().toISOString() };
        const sb = getSupabase();
        if (sb) sbLog(sb.from("mesas").update({ estado: "ocupada", pedido_activo_ids: next.pedidoActivoIds, updated_at: next.updatedAt }).eq("id", mesaId), "ocuparMesa");
        return next;
      })
    );
  };
  const liberarMesaSiVacia = (mesaId: string, pedidoId: string) => {
    setMesas((prev) =>
      prev.map((m) => {
        if (m.id !== mesaId) return m;
        const restantes = m.pedidoActivoIds.filter((id) => id !== pedidoId);
        const next = { ...m, pedidoActivoIds: restantes, estado: restantes.length === 0 ? ("disponible" as const) : m.estado, updatedAt: new Date().toISOString() };
        const sb = getSupabase();
        if (sb) sbLog(sb.from("mesas").update({ pedido_activo_ids: restantes, estado: next.estado, updated_at: next.updatedAt }).eq("id", mesaId), "liberarMesaSiVacia");
        return next;
      })
    );
  };

  const addTicketCocina = (t: TicketCocina) => {
    setTicketsCocina((prev) => [t, ...prev]);
    const sb = getSupabase();
    if (sb) sbLog(sb.from("tickets_cocina").insert(toTicketRow(t)), "addTicketCocina");
  };
  const updateTicketCocina = (id: string, data: Partial<TicketCocina>) => {
    setTicketsCocina((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    const sb = getSupabase();
    if (sb) {
      const row: Record<string, unknown> = {};
      if (data.impresoEn !== undefined) row.impreso_en = data.impresoEn;
      if (data.reimpresiones !== undefined) row.reimpresiones = data.reimpresiones;
      if (Object.keys(row).length) sbLog(sb.from("tickets_cocina").update(row).eq("id", id), "updateTicketCocina");
    }
  };
  const addFactura = (f: Factura) => {
    setFacturas((prev) => [f, ...prev]);
    const sb = getSupabase();
    if (sb) sbLog(sb.from("facturas").insert(toFacturaRow(f)), "addFactura");
  };

  const resetMock = () => {
    setProductos(PRODUCTOS_MOCK);
    setPedidos(PEDIDOS_MOCK);
    setMesas(MESAS_MOCK);
    setTicketsCocina([]);
    setFacturas([]);
    localStorage.removeItem(STORAGE_PRODUCTOS);
    localStorage.removeItem(STORAGE_PEDIDOS);
    localStorage.removeItem(STORAGE_MESAS);
    localStorage.removeItem(STORAGE_TICKETS);
    localStorage.removeItem(STORAGE_FACTURAS);
  };

  return (
    <StoreContext.Provider
      value={{
        productos,
        pedidos,
        mesas,
        ticketsCocina,
        facturas,
        hydrated,
        supabaseEnabled: isSupabaseConfigured,
        addProducto,
        updateProducto,
        deleteProducto,
        addPedido,
        updatePedido,
        deletePedido,
        addMesa,
        updateMesa,
        deleteMesa,
        ocuparMesa,
        liberarMesaSiVacia,
        addTicketCocina,
        updateTicketCocina,
        addFactura,
        resetMock,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function calcTotal(items: DetallePedido[]) {
  return items.reduce((acc, i) => acc + i.subtotal, 0);
}
