"use client";
import { useStore } from "@/lib/store";
import { formatCOP, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_COLOR, ESTADOS_LABEL } from "@/types";
import Link from "next/link";

export default function PedidosPage() {
  const { pedidos } = useStore();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Pedidos <span className="text-[#FF6B00]">• Gigi Papas</span></h1>
        <Link href="/pedidos" className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg font-semibold text-sm">+ Nuevo pedido</Link>
      </div>
      <p className="text-sm text-zinc-500">Módulo toma por mesa, carrito, notas — próximo commit habilita creación completa.</p>
      <div className="grid gap-3">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border p-4 flex justify-between items-start">
            <div>
              <p className="font-bold">{p.id} — Mesa {p.mesa}</p>
              <p className="text-sm text-zinc-600">{p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", ")}</p>
              <p className="text-xs text-zinc-400">{formatDate(p.createdAt)} • {p.notas}</p>
            </div>
            <div className="text-right">
              <Badge className={ESTADOS_COLOR[p.estado]}>{ESTADOS_LABEL[p.estado]}</Badge>
              <p className="font-black mt-1">{formatCOP(p.total)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
