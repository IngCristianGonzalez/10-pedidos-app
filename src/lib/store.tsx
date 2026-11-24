"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Producto, Pedido, DetallePedido, Mesa, TicketCocina, Factura, EstadoPedido, MedioPago } from "@/types";
import { PRODUCTOS_MOCK, PEDIDOS_MOCK, MESAS_MOCK } from "./mock-data";
import {
  getSupabase,
  isSupabaseConfigured,
  mapMesa,
  mapProducto,
  mapPedido,
  mapTicket,
  mapFactura,
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
  // Toda escritura pasa por /api (service_role + validación). El cliente jamás
  // escribe directo a Supabase: la key anónima solo tiene permiso de lectura.
  crearPedido: (input: {
    mesa: string;
    items: DetallePedido[];
    notas: string;
    creadoPor: string;
    esQr: boolean;
  }) => Promise<{ ok: true; pedidoId: string } | { ok: false; error: string }>;
  avanzarPedido: (
    id: string,
    opts: { estado: EstadoPedido; medioPago?: MedioPago; notaRef?: string; crearFactura?: boolean }
  ) => Promise<{ ok: true; factura?: Factura } | { ok: false; error: string }>;
  deletePedido: (id: string) => void;
  addMesa: (m: Mesa) => void;
  updateMesa: (id: string, data: Partial<Mesa>) => void;
  deleteMesa: (id: string) => void;
  addTicketCocina: (t: TicketCocina) => void;
  updateTicketCocina: (id: string, data: Partial<TicketCocina>) => void;
  resetMock: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

// Llamada al API servidor (service_role). Nunca lanza: devuelve {ok:false}.
// Las lecturas siguen directas con la key anónima (solo-lectura por RLS).
async function apiMut<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(path, init);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) return { ok: false, error: json?.error || `Error ${res.status}` };
    return { ok: true, data: json.data as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Error de red" };
  }
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
            // Si productos está vacío en DB, el seed vive en supabase.sql (la key anónima es solo-lectura).
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
    void apiMut("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then((r) => {
      if (!r.ok) console.error("[API] addProducto:", r.error);
    });
  };
  const updateProducto = (id: string, data: Partial<Producto>) => {
    const patch: Record<string, unknown> = {};
    if (data.nombre !== undefined) patch.nombre = data.nombre;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
    if (data.precio !== undefined) patch.precio = data.precio;
    if (data.categoria !== undefined) patch.categoria = data.categoria;
    if (data.imagen !== undefined) patch.imagen = data.imagen;
    if (data.disponible !== undefined) patch.disponible = data.disponible;
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    if (Object.keys(patch).length) {
      void apiMut("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      }).then((r) => {
        if (!r.ok) console.error("[API] updateProducto:", r.error);
      });
    }
  };
  const deleteProducto = (id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    void apiMut(`/api/productos?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) console.error("[API] deleteProducto:", r.error);
    });
  };

  // Crea pedido + ticket + ocupa mesa en el servidor (totales calculados allá).
  const crearPedido = async (input: {
    mesa: string;
    items: DetallePedido[];
    notas: string;
    creadoPor: string;
    esQr: boolean;
  }): Promise<{ ok: true; pedidoId: string } | { ok: false; error: string }> => {
    const r = await apiMut<{ pedido: Pedido; ticket: TicketCocina | null }>("/api/pedidos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!r.ok) {
      console.error("[API] crearPedido:", r.error);
      return r;
    }
    setPedidos((prev) => [r.data.pedido, ...prev]);
    if (r.data.ticket) setTicketsCocina((prev) => [r.data.ticket as TicketCocina, ...prev]);
    setMesas((prev) =>
      prev.map((m) =>
        m.numero === r.data.pedido.mesa
          ? { ...m, estado: "ocupada" as const, pedidoActivoIds: [...m.pedidoActivoIds, r.data.pedido.id], updatedAt: new Date().toISOString() }
          : m
      )
    );
    return { ok: true, pedidoId: r.data.pedido.id };
  };

  // Cambia estado con validación en servidor. Si pide factura, el servidor la
  // genera (prepago transferencia o cobro final) y la devuelve.
  const avanzarPedido = async (
    id: string,
    opts: { estado: EstadoPedido; medioPago?: MedioPago; notaRef?: string; crearFactura?: boolean }
  ): Promise<{ ok: true; factura?: Factura } | { ok: false; error: string }> => {
    const r = await apiMut<{ pedido: Pedido; factura: Factura | null }>("/api/pedidos/estado", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...opts }),
    });
    if (!r.ok) {
      console.error("[API] avanzarPedido:", r.error);
      return r;
    }
    setPedidos((prev) => prev.map((p) => (p.id === id ? r.data.pedido : p)));
    if (r.data.factura) setFacturas((prev) => [r.data.factura as Factura, ...prev]);
    if (["pagado", "cancelado"].includes(r.data.pedido.estado) && r.data.pedido.mesaId) {
      const mesaId = r.data.pedido.mesaId;
      const pid = r.data.pedido.id;
      setMesas((prev) =>
        prev.map((m) => {
          if (m.id !== mesaId) return m;
          const restantes = m.pedidoActivoIds.filter((x) => x !== pid);
          return {
            ...m,
            pedidoActivoIds: restantes,
            estado: restantes.length === 0 ? ("disponible" as const) : m.estado,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }
    return { ok: true, factura: r.data.factura ?? undefined };
  };
  const deletePedido = (id: string) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    void apiMut(`/api/pedidos/estado?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) console.error("[API] deletePedido:", r.error);
    });
  };

  const addMesa = (m: Mesa) => {
    setMesas((prev) => [...prev, m]);
    void apiMut("/api/mesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, numero: m.numero, estado: m.estado, capacidad: m.capacidad }),
    }).then((r) => {
      if (!r.ok) console.error("[API] addMesa:", r.error);
    });
  };
  const updateMesa = (id: string, data: Partial<Mesa>) => {
    const patch: Record<string, unknown> = {};
    if (data.numero !== undefined) patch.numero = data.numero;
    if (data.estado !== undefined) patch.estado = data.estado;
    if (data.capacidad !== undefined) patch.capacidad = data.capacidad;
    setMesas((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m)));
    if (Object.keys(patch).length) {
      void apiMut("/api/mesas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      }).then((r) => {
        if (!r.ok) console.error("[API] updateMesa:", r.error);
      });
    }
  };
  const deleteMesa = (id: string) => {
    setMesas((prev) => prev.filter((m) => m.id !== id));
    void apiMut(`/api/mesas?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) console.error("[API] deleteMesa:", r.error);
    });
  };

  // Solo local: el ticket lo crea el servidor al crear el pedido.
  const addTicketCocina = (t: TicketCocina) => {
    setTicketsCocina((prev) => [t, ...prev]);
  };
  const updateTicketCocina = (id: string, data: Partial<TicketCocina>) => {
    setTicketsCocina((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    const patch: Record<string, unknown> = {};
    if (data.impresoEn !== undefined) patch.impresoEn = data.impresoEn;
    if (data.reimpresiones !== undefined) patch.reimpresiones = data.reimpresiones;
    if (Object.keys(patch).length) {
      void apiMut("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      }).then((r) => {
        if (!r.ok) console.error("[API] updateTicketCocina:", r.error);
      });
    }
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
        crearPedido,
        avanzarPedido,
        deletePedido,
        addMesa,
        updateMesa,
        deleteMesa,
        addTicketCocina,
        updateTicketCocina,
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
