"use client";
import { useState } from "react";
import { useStore, calcTotal } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatCOP, formatDate, uid } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DetallePedido, EstadoPedido, ESTADOS_COLOR, ESTADOS_LABEL } from "@/types";

export default function PedidosPage() {
  const { productos, pedidos, addPedido, updatePedido, deletePedido } = useStore();
  const { user } = useAuth();
  const [mesa, setMesa] = useState("");
  const [notas, setNotas] = useState("");
  const [carrito, setCarrito] = useState<DetallePedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [query, setQuery] = useState("");

  const addToCart = (productoId: string) => {
    const p = productos.find((x) => x.id === productoId);
    if (!p || !p.disponible) return;
    setCarrito((prev) => {
      const found = prev.find((i) => i.productoId === p.id);
      if (found) return prev.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * p.precio } : i));
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, subtotal: p.precio }];
    });
  };

  const updateQty = (productoId: string, qty: number) => {
    if (qty <= 0) setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));
    else setCarrito((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: qty, subtotal: qty * i.precio } : i)));
  };

  const handleCrear = () => {
    if (!mesa || carrito.length === 0) return alert("Mesa y al menos 1 producto");
    const total = calcTotal(carrito);
    const nuevo = {
      id: uid("PED-"),
      mesa,
      items: carrito,
      estado: "pendiente" as EstadoPedido,
      total,
      notas,
      medioPago: null,
      creadoPor: user?.id || "u2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addPedido(nuevo);
    setCarrito([]);
    setMesa("");
    setNotas("");
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    const matchQuery = query === "" || p.mesa.includes(query) || p.id.toLowerCase().includes(query.toLowerCase());
    return matchEstado && matchQuery;
  });

  const totalCarrito = calcTotal(carrito);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <h1 className="text-2xl font-black">Pedidos <span className="text-[#FF6B00]">• Toma por mesa</span></h1>
        <div className="flex gap-2">
          <Input placeholder="Buscar mesa o ID" value={query} onChange={(e) => setQuery(e.target.value)} className="w-40" />
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo">Listo</option>
            <option value="entregado">Entregado</option>
            <option value="pagado">Pagado</option>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-6">
        {/* Menú */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <p className="font-bold">Menú Gigi — click para agregar</p>
            <span className="text-xs bg-zinc-100 px-2 py-1 rounded-full">{productos.filter((p) => p.disponible).length} disponibles</span>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3 max-h-[520px] overflow-auto pr-1">
              {productos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  disabled={!p.disponible}
                  className={`text-left border rounded-xl p-3 hover:border-[#FF6B00] hover:bg-orange-50 transition flex gap-3 ${!p.disponible ? "opacity-50 grayscale" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imagen} alt={p.nombre} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{p.nombre}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{p.descripcion}</p>
                    <p className="font-black text-[#FF6B00] text-sm mt-1">{formatCOP(p.precio)}</p>
                  </div>
                  <span className="text-[#FF6B00] font-black text-xl">+</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Carrito */}
        <Card className="border-[#FF6B00]/20">
          <CardHeader>
            <p className="font-bold">Carrito • Mesa</p>
            <p className="text-xs text-zinc-500">Efectivo + transferencia (caja cobra después)</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mesa *</Label>
                <Input placeholder="Ej: 3 / Barra / Domicilio" value={mesa} onChange={(e) => setMesa(e.target.value)} />
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-xs text-zinc-500">Items</p>
                <p className="font-black text-lg">{carrito.reduce((a, i) => a + i.cantidad, 0)} • {formatCOP(totalCarrito)}</p>
              </div>
            </div>

            {carrito.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6 border-2 border-dashed rounded-xl">Carrito vacío — toca un producto</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {carrito.map((i) => (
                  <div key={i.productoId} className="flex justify-between items-center bg-zinc-50 rounded-lg p-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{i.nombre}</p>
                      <p className="text-xs text-zinc-500">{formatCOP(i.precio)} x {i.cantidad} = {formatCOP(i.subtotal)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateQty(i.productoId, i.cantidad - 1)}>-</Button>
                      <span className="w-6 text-center text-sm font-bold">{i.cantidad}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQty(i.productoId, i.cantidad + 1)}>+</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateQty(i.productoId, 0)}>×</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>Notas cocina</Label>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Sin cebolla, extra queso..." rows={2} />
            </div>

            <div className="bg-black text-white rounded-xl p-3 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-black text-[#FF6B00] text-xl">{formatCOP(totalCarrito)}</span>
            </div>

            <Button className="w-full" size="lg" onClick={handleCrear} disabled={carrito.length === 0 || !mesa}>
              Crear pedido — Mesa {mesa || "?"}
            </Button>
            {carrito.length > 0 && <Button variant="outline" className="w-full" onClick={() => setCarrito([])}>Vaciar</Button>}
          </CardContent>
        </Card>
      </div>

      {/* Lista pedidos */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Pedidos recientes — {pedidosFiltrados.length} / {pedidos.length}</h2>
        {pedidosFiltrados.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-black">{p.id}</p>
                  <Badge className={ESTADOS_COLOR[p.estado]}>{ESTADOS_LABEL[p.estado]}</Badge>
                  <span className="text-sm bg-zinc-100 px-2 py-0.5 rounded-full">Mesa {p.mesa}</span>
                </div>
                <p className="text-sm text-zinc-600 mt-1">{p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(" • ")}</p>
                <p className="text-xs text-zinc-400">{formatDate(p.createdAt)} • {p.notas || "sin notas"} • {formatCOP(p.total)}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(["pendiente", "en_preparacion", "listo", "entregado", "pagado"] as EstadoPedido[]).map((est) => (
                  <button
                    key={est}
                    onClick={() => updatePedido(p.id, { estado: est })}
                    className={`text-xs px-2 py-1 rounded-full border font-semibold ${p.estado === est ? "bg-[#FF6B00] text-white border-[#FF6B00]" : "bg-white hover:bg-zinc-50"}`}
                  >
                    {ESTADOS_LABEL[est]}
                  </button>
                ))}
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm("Eliminar?")) deletePedido(p.id); }}>Eliminar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {pedidosFiltrados.length === 0 && <p className="text-center text-zinc-400 py-6">Sin pedidos con ese filtro</p>}
      </div>
    </div>
  );
}
