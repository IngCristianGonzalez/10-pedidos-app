"use client";
import { useStore } from "@/lib/store";
import { formatCOP } from "@/lib/utils";


export default function CajaPage() {
  const { pedidos } = useStore();
  const porCobrar = pedidos.filter((p) => !["pagado", "cancelado"].includes(p.estado));
  const total = porCobrar.reduce((a, p) => a + p.total, 0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Caja <span className="text-[#FF6B00]">— Cobro + Ticket</span></h1>
      <div className="bg-black text-white rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-white/60">Por cobrar</p>
          <p className="text-2xl font-black">{formatCOP(total)}</p>
        </div>
        <p className="text-sm bg-[#FF6B00] px-3 py-1 rounded-full">{porCobrar.length} pedidos</p>
      </div>
      <p className="text-sm text-zinc-500">Medios: efectivo + transferencia • Impresión ticket navegador (próximo commit).</p>
      <div className="space-y-2">
        {porCobrar.map((p) => (
          <div key={p.id} className="bg-white border rounded-xl p-3 flex justify-between">
            <span className="font-medium">Mesa {p.mesa} • {p.id}</span>
            <span className="font-black">{formatCOP(p.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
