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
    <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold tracking-tight">Mesa {p.mesa} <span className="text-zinc-400 font-normal">• {p.id}</span></p>
          <p className="text-xs tracking-wide text-zinc-500">{formatDate(p.createdAt)} — hace {minutes(p.createdAt)} min</p>
        </div>
        <Badge className={ESTADOS_COLOR[p.estado]}>{ESTADOS_LABEL[p.estado]}</Badge>
      </div>
      <ul className="mt-3 space-y-1">
        {p.items.map((i) => (
          <li key={i.productoId} className="flex justify-between text-[13px] bg-zinc-50 rounded-xl px-2.5 py-1.5">
            <span className="tracking-tight">{i.cantidad}x {i.nombre}</span><span className="font-semibold tabular-nums">{i.cantidad}</span>
          </li>
        ))}
      </ul>
      {p.notas && <p className="text-xs mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 tracking-tight">Notas: {p.notas}</p>}
      <div className="mt-3 flex gap-2 flex-wrap">{actions}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cocina</h1>
        <div className="flex gap-2 text-xs">
          <span className="bg-amber-100 border border-amber-200 px-3 py-1 rounded-full font-medium tracking-tight tabular-nums">{pendientes.length} pendientes</span>
          <span className="bg-orange-100 border border-orange-200 px-3 py-1 rounded-full font-medium tracking-tight tabular-nums">{enPrep.length} en preparacion</span>
          <span className="bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full font-medium tracking-tight tabular-nums">{listos.length} listos</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <h2 className="font-semibold tracking-tight flex items-center gap-2">Pendientes <span className="bg-[#1d1d1f] text-white text-xs px-2 py-0.5 rounded-full tabular-nums">{pendientes.length}</span></h2>
          {pendientes.length === 0 && <p className="text-sm text-zinc-400 bg-white border border-dashed rounded-2xl p-4 text-center">Sin pendientes</p>}
          {pendientes.map((p) => (
            <CardPedido key={p.id} p={p} actions={<><Button size="sm" onClick={() => updatePedido(p.id, { estado: "en_preparacion" })}>Cocinar</Button><Button size="sm" variant="outline" onClick={() => updatePedido(p.id, { estado: "cancelado" })}>Cancelar</Button></>} />
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold tracking-tight">En preparacion</h2>
          {enPrep.length === 0 && <p className="text-sm text-zinc-400 bg-white border border-dashed rounded-2xl p-4 text-center">Nada en preparacion</p>}
          {enPrep.map((p) => (
            <CardPedido key={p.id} p={p} actions={<><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updatePedido(p.id, { estado: "listo" })}>Listo</Button><Button size="sm" variant="outline" onClick={() => updatePedido(p.id, { estado: "pendiente" })}>Devolver</Button></>} />
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold tracking-tight">Listos para entregar</h2>
          {listos.length === 0 && <p className="text-sm text-zinc-400 bg-white border border-dashed rounded-2xl p-4 text-center">Sin listos</p>}
          {listos.map((p) => (
            <CardPedido key={p.id} p={p} actions={<><Button size="sm" variant="secondary" onClick={() => updatePedido(p.id, { estado: "entregado" })}>Entregado</Button><Button size="sm" variant="outline" onClick={() => updatePedido(p.id, { estado: "en_preparacion" })}>Corregir</Button></>} />
          ))}
        </div>
      </div>
    </div>
  );
}
