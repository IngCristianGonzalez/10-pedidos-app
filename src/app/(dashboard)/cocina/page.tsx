"use client";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ESTADOS_COLOR, ESTADOS_LABEL } from "@/types";
import { formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function CocinaPage() {
  const { pedidos, updatePedido } = useStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const pendientes = pedidos.filter((p) => p.estado === "pendiente").sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const enPrep = pedidos.filter((p) => p.estado === "en_preparacion").sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const listos = pedidos.filter((p) => p.estado === "listo").sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  const minutes = (iso: string) => Math.floor((now - +new Date(iso)) / 60000);

  const CardPedido = ({ p, actions }: { p: (typeof pedidos)[number]; actions: React.ReactNode }) => (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-black">Mesa {p.mesa} <span className="text-zinc-400 font-normal">• {p.id}</span></p>
          <p className="text-xs text-zinc-500">{formatDate(p.createdAt)} • hace {minutes(p.createdAt)} min</p>
        </div>
        <Badge className={ESTADOS_COLOR[p.estado]}>{ESTADOS_LABEL[p.estado]}</Badge>
      </div>
      <ul className="mt-3 space-y-1">
        {p.items.map((i) => (
          <li key={i.productoId} className="flex justify-between text-sm bg-zinc-50 rounded-lg px-2 py-1">
            <span>{i.cantidad}x {i.nombre}</span><span className="font-semibold">{i.cantidad}</span>
          </li>
        ))}
      </ul>
      {p.notas && <p className="text-xs mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">📝 {p.notas}</p>}
      <div className="mt-3 flex gap-2 flex-wrap">{actions}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <h1 className="text-2xl font-black">Cocina <span className="text-[#FF6B00]">— Cola Realtime local</span></h1>
        <div className="flex gap-2 text-xs">
          <span className="bg-yellow-100 border border-yellow-300 px-3 py-1 rounded-full font-bold">{pendientes.length} pendientes</span>
          <span className="bg-orange-100 border border-orange-300 px-3 py-1 rounded-full font-bold">{enPrep.length} en prep</span>
          <span className="bg-green-100 border border-green-300 px-3 py-1 rounded-full font-bold">{listos.length} listos</span>
        </div>
      </div>
      <p className="text-sm text-zinc-500">Simula Realtime: pendiente → en preparación → listo. Luego Supabase Realtime channel <code>pedidos</code>. Se actualiza en 30s.</p>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">🟡 Pendientes <span className="bg-zinc-900 text-white text-xs px-2 py-0.5 rounded-full">{pendientes.length}</span></h2>
          {pendientes.length === 0 && <p className="text-sm text-zinc-400 bg-white border border-dashed rounded-xl p-4 text-center">Sin pendientes</p>}
          {pendientes.map((p) => (
            <CardPedido key={p.id} p={p} actions={<><Button size="sm" onClick={() => updatePedido(p.id, { estado: "en_preparacion" })}>▶️ Cocinar</Button><Button size="sm" variant="outline" onClick={() => updatePedido(p.id, { estado: "cancelado" })}>Cancelar</Button></>} />
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">🟠 En preparación</h2>
          {enPrep.length === 0 && <p className="text-sm text-zinc-400 bg-white border border-dashed rounded-xl p-4 text-center">Nada en fuego</p>}
          {enPrep.map((p) => (
            <CardPedido key={p.id} p={p} actions={<><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updatePedido(p.id, { estado: "listo" })}>✅ Listo</Button><Button size="sm" variant="outline" onClick={() => updatePedido(p.id, { estado: "pendiente" })}>↩️ Devolver</Button></>} />
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">🟢 Listos para entregar</h2>
          {listos.length === 0 && <p className="text-sm text-zinc-400 bg-white border border-dashed rounded-xl p-4 text-center">Sin listos</p>}
          {listos.map((p) => (
            <CardPedido key={p.id} p={p} actions={<><Button size="sm" variant="secondary" onClick={() => updatePedido(p.id, { estado: "entregado" })}>📦 Entregado</Button><Button size="sm" variant="outline" onClick={() => updatePedido(p.id, { estado: "en_preparacion" })}>↩️ Corregir</Button></>} />
          ))}
        </div>
      </div>
    </div>
  );
}
