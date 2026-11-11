"use client";
import { useStore } from "@/lib/store";
import { formatCOP } from "@/lib/utils";

export default function ReportesPage() {
  const { pedidos } = useStore();
  const pagados = pedidos.filter((p) => p.estado === "pagado");
  const ventas = pagados.reduce((a, p) => a + p.total, 0);
  const pendientes = pedidos.filter((p) => p.estado !== "pagado" && p.estado !== "cancelado").length;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Reportes <span className="text-[#FF6B00]">— Ventas & Cierre</span></h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-zinc-500">Ventas totales (pagados)</p>
          <p className="text-2xl font-black">{formatCOP(ventas)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-zinc-500">Pedidos pagados</p>
          <p className="text-2xl font-black">{pagados.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-zinc-500">Por cobrar / pendientes</p>
          <p className="text-2xl font-black">{pendientes}</p>
        </div>
      </div>
      <p className="text-sm text-zinc-500">Próximo commit: cierre de caja, export Excel/PDF, filtro día/mes.</p>
    </div>
  );
}
