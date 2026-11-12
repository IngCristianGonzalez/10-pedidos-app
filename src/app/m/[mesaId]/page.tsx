"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore, calcTotal } from "@/lib/store";
import { formatCOP, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DetallePedido, EstadoPedido } from "@/types";

export default function MesaPublicPage() {
  const params = useParams<{ mesaId: string }>();
  const idOrNumero = decodeURIComponent(params.mesaId || "");
  const { mesas, productos, addPedido, ocuparMesa, addTicketCocina } = useStore();
  const mesa = mesas.find((m) => m.numero === idOrNumero || m.id === idOrNumero);
  const [carrito, setCarrito] = useState<DetallePedido[]>([]);
  const [notas, setNotas] = useState("");
  const [ok, setOk] = useState<string | null>(null);

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

  const handlePedir = () => {
    if (!mesa) return;
    if (carrito.length === 0) return alert("Agrega al menos 1 producto");
    const total = calcTotal(carrito);
    const pedidoId = uid("PED-");
    const ticketId = uid("TK-");
    const nuevo = {
      id: pedidoId,
      mesa: mesa.numero,
      mesaId: mesa.id,
      items: carrito,
      estado: "pendiente" as EstadoPedido,
      total,
      notas,
      medioPago: null,
      creadoPor: "qr",
      esQr: true,
      ticketCocinaId: ticketId,
      facturaId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ticket = {
      id: ticketId,
      pedidoId,
      mesaId: mesa.id,
      numeroMesa: mesa.numero,
      items: carrito,
      notas,
      impresoEn: null,
      reimpresiones: 0,
      createdAt: new Date().toISOString(),
    };
    addPedido(nuevo);
    addTicketCocina(ticket);
    ocuparMesa(mesa.id, pedidoId);
    setCarrito([]);
    setNotas("");
    setOk(pedidoId);
  };

  if (!mesa) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="font-semibold tracking-tight">Mesa no encontrada</p>
            <p className="text-sm text-zinc-500 mt-1">Verifica el QR. Mesas validas: 1, 2, 3. Este link es /m/{idOrNumero}.</p>
            <p className="text-xs text-zinc-400 mt-3">Publico sin login — escanea QR de mesa para pedir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disponibles = productos.filter((p) => p.disponible);
  const totalCarrito = calcTotal(carrito);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <header className="sticky top-0 z-20 material border-b border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-9 h-9 rounded-xl object-cover border border-black/10" />
          <div>
            <p className="font-semibold tracking-tight leading-none">Gigi Papas</p>
            <p className="text-[11px] tracking-wide text-zinc-500 uppercase">Mesa {mesa.numero}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${mesa.estado === "disponible" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}>{mesa.estado}</span>
      </header>

      {ok && (
        <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="font-semibold tracking-tight text-emerald-800">Pedido enviado — {ok}</p>
          <p className="text-sm text-emerald-700">Recibido en cocina. Te avisamos cuando este listo.</p>
          <Button size="sm" className="mt-2" variant="outline" onClick={() => setOk(null)}>Hacer otro pedido</Button>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 grid lg:grid-cols-[1.4fr_0.9fr] gap-6">
        <Card>
          <CardHeader><p className="font-semibold tracking-tight">Menu</p><p className="text-xs text-zinc-500 tabular-nums">{disponibles.length} disponibles</p></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {disponibles.map((p) => (
                <button key={p.id} onClick={() => addToCart(p.id)} className="text-left border border-black/[0.06] rounded-2xl p-3 hover:border-[#FF6B00]/40 hover:bg-orange-50/50 transition flex gap-3 active:scale-[0.98]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imagen} alt={p.nombre} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm tracking-tight truncate">{p.nombre}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{p.descripcion}</p>
                    <p className="font-semibold text-[#FF6B00] text-sm mt-1">{formatCOP(p.precio)}</p>
                  </div>
                  <span className="text-[#FF6B00] font-semibold">+</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#FF6B00]/20 h-fit sticky top-[68px]">
          <CardHeader><p className="font-semibold tracking-tight">Tu pedido — Mesa {mesa.numero}</p></CardHeader>
          <CardContent className="space-y-3">
            {carrito.length === 0 ? <p className="text-sm text-zinc-400 text-center py-6 border-2 border-dashed rounded-2xl">Carrito vacio — toca un producto</p> : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {carrito.map((i) => (
                  <div key={i.productoId} className="flex justify-between items-center bg-zinc-50 rounded-xl p-2.5">
                    <div className="flex-1">
                      <p className="font-medium text-sm tracking-tight">{i.nombre}</p>
                      <p className="text-xs text-zinc-500">{formatCOP(i.precio)} x {i.cantidad} = {formatCOP(i.subtotal)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateQty(i.productoId, i.cantidad - 1)}>-</Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{i.cantidad}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQty(i.productoId, i.cantidad + 1)}>+</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div><Label>Notas cocina</Label><Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Sin cebolla, extra queso..." rows={2} /></div>
            <div className="bg-[#1d1d1f] text-white rounded-2xl p-3 flex justify-between items-center"><span className="font-medium">Total</span><span className="font-semibold text-[#FF6B00] tabular-nums">{formatCOP(totalCarrito)}</span></div>
            <Button className="w-full" size="lg" onClick={handlePedir} disabled={carrito.length === 0}>Enviar pedido — Mesa {mesa.numero}</Button>
          </CardContent>
        </Card>
      </main>

      <footer className="p-6 text-center text-xs tracking-wide text-zinc-500">Gigi Papas — Comidas Rapidas</footer>
    </div>
  );
}
