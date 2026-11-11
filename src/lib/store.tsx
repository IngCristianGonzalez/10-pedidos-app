"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Producto, Pedido, DetallePedido } from "@/types";
import { PRODUCTOS_MOCK, PEDIDOS_MOCK } from "./mock-data";

const STORAGE_PRODUCTOS = "gigi_productos";
const STORAGE_PEDIDOS = "gigi_pedidos";

type StoreContextType = {
  productos: Producto[];
  pedidos: Pedido[];
  addProducto: (p: Producto) => void;
  updateProducto: (id: string, data: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;
  addPedido: (pedido: Pedido) => void;
  updatePedido: (id: string, data: Partial<Pedido>) => void;
  deletePedido: (id: string) => void;
  resetMock: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [pedidos, setPedidos] = useState<Pedido[]>(PEDIDOS_MOCK);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const sp = localStorage.getItem(STORAGE_PRODUCTOS);
      const sd = localStorage.getItem(STORAGE_PEDIDOS);
      if (sp) setProductos(JSON.parse(sp));
      if (sd) setPedidos(JSON.parse(sd));
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

  const addProducto = (p: Producto) => setProductos((prev) => [p, ...prev]);
  const updateProducto = (id: string, data: Partial<Producto>) =>
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  const deleteProducto = (id: string) => setProductos((prev) => prev.filter((p) => p.id !== id));

  const addPedido = (pedido: Pedido) => setPedidos((prev) => [pedido, ...prev]);
  const updatePedido = (id: string, data: Partial<Pedido>) =>
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)));
  const deletePedido = (id: string) => setPedidos((prev) => prev.filter((p) => p.id !== id));
  const resetMock = () => {
    setProductos(PRODUCTOS_MOCK);
    setPedidos(PEDIDOS_MOCK);
    localStorage.removeItem(STORAGE_PRODUCTOS);
    localStorage.removeItem(STORAGE_PEDIDOS);
  };

  return (
    <StoreContext.Provider
      value={{ productos, pedidos, addProducto, updateProducto, deleteProducto, addPedido, updatePedido, deletePedido, resetMock }}
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
