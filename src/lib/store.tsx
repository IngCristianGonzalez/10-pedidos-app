"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Producto, Pedido, DetallePedido, Mesa, TicketCocina, Factura } from "@/types";
import { PRODUCTOS_MOCK, PEDIDOS_MOCK, MESAS_MOCK } from "./mock-data";

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
  addProducto: (p: Producto) => void;
  updateProducto: (id: string, data: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;
  addPedido: (pedido: Pedido) => void;
  updatePedido: (id: string, data: Partial<Pedido>) => void;
  deletePedido: (id: string) => void;
  addMesa: (m: Mesa) => void;
  updateMesa: (id: string, data: Partial<Mesa>) => void;
  ocuparMesa: (mesaId: string, pedidoId: string) => void;
  liberarMesaSiVacia: (mesaId: string, pedidoId: string) => void;
  addTicketCocina: (t: TicketCocina) => void;
  updateTicketCocina: (id: string, data: Partial<TicketCocina>) => void;
  addFactura: (f: Factura) => void;
  resetMock: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [pedidos, setPedidos] = useState<Pedido[]>(PEDIDOS_MOCK);
  const [mesas, setMesas] = useState<Mesa[]>(MESAS_MOCK);
  const [ticketsCocina, setTicketsCocina] = useState<TicketCocina[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
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
    setHydrated(true);
  }, []);

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

  const addProducto = (p: Producto) => setProductos((prev) => [p, ...prev]);
  const updateProducto = (id: string, data: Partial<Producto>) =>
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  const deleteProducto = (id: string) => setProductos((prev) => prev.filter((p) => p.id !== id));

  const addPedido = (pedido: Pedido) => setPedidos((prev) => [pedido, ...prev]);
  const updatePedido = (id: string, data: Partial<Pedido>) =>
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)));
  const deletePedido = (id: string) => setPedidos((prev) => prev.filter((p) => p.id !== id));

  const addMesa = (m: Mesa) => setMesas((prev) => [...prev, m]);
  const updateMesa = (id: string, data: Partial<Mesa>) =>
    setMesas((prev) => prev.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m)));
  const ocuparMesa = (mesaId: string, pedidoId: string) =>
    setMesas((prev) => prev.map((m) => (m.id === mesaId ? { ...m, estado: "ocupada" as const, pedidoActivoIds: [...m.pedidoActivoIds, pedidoId], updatedAt: new Date().toISOString() } : m)));
  const liberarMesaSiVacia = (mesaId: string, pedidoId: string) =>
    setMesas((prev) =>
      prev.map((m) => {
        if (m.id !== mesaId) return m;
        const restantes = m.pedidoActivoIds.filter((id) => id !== pedidoId);
        return { ...m, pedidoActivoIds: restantes, estado: restantes.length === 0 ? ("disponible" as const) : m.estado, updatedAt: new Date().toISOString() };
      })
    );

  const addTicketCocina = (t: TicketCocina) => setTicketsCocina((prev) => [t, ...prev]);
  const updateTicketCocina = (id: string, data: Partial<TicketCocina>) =>
    setTicketsCocina((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  const addFactura = (f: Factura) => setFacturas((prev) => [f, ...prev]);

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
      value={{ productos, pedidos, mesas, ticketsCocina, facturas, addProducto, updateProducto, deleteProducto, addPedido, updatePedido, deletePedido, addMesa, updateMesa, ocuparMesa, liberarMesaSiVacia, addTicketCocina, updateTicketCocina, addFactura, resetMock }}
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
