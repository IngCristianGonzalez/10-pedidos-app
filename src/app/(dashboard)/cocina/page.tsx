"use client";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_COLOR, ESTADOS_LABEL } from "@/types";
import { formatDate } from "@/lib/utils";

export default function CocinaPage() {
  const { pedidos } = useStore();
  const cola = pedidos.filter((p) => ["pendiente", "en_preparacion"].includes(p.estado));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Cocina <span className="text-[#FF6B00]">— Cola Realtime (local)</span></h1>
      <p className="text-sm text-zinc-500">Pendiente → En preparación → Listo (simulado local, luego Supabase Realtime).</p>
      <div className="grid md:grid-cols-2 gap-3">
        {cola.length === 0 && <p className="text-zinc-400">Sin pedidos en cola 🎉</p>}
        {cola.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            <div className="flex justify-between">
              <p className="font-bold">Mesa {p.mesa} • {p.id}</p>
              <Badge className={ESTADOS_COLOR[p.estado]}>{ESTADOS_LABEL[p.estado]}</Badge>
            </div>
            <ul className="text-sm mt-2 list-disc ml-4">
              {p.items.map((i) => <li key={i.productoId}>{i.cantidad}x {i.nombre}</li>)}
            </ul>
            <p className="text-xs text-zinc-400 mt-2">{formatDate(p.createdAt)} • {p.notas}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
