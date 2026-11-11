"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatCOP, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function ReportesPage() {
  const { pedidos } = useStore();
  const [filtro, setFiltro] = useState<"hoy" | "semana" | "mes" | "todos">("hoy");

  const filtrados = useMemo(() => {
    const now = new Date();
    return pedidos.filter((p) => {
      if (filtro === "todos") return true;
      const d = new Date(p.createdAt);
      if (filtro === "hoy") return d.toDateString() === now.toDateString();
      if (filtro === "semana") {
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (filtro === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [pedidos, filtro]);

  const pagados = filtrados.filter((p) => p.estado === "pagado");
  const ventas = pagados.reduce((a, p) => a + p.total, 0);
  const porMedio = (medio: string) => pagados.filter((p) => p.medioPago === medio).reduce((a, p) => a + p.total, 0);
  const efectivo = porMedio("efectivo");
  const transferencia = porMedio("transferencia");
  const ticketPromedio = pagados.length ? Math.round(ventas / pagados.length) : 0;

  // top productos
  const topProductos = useMemo(() => {
    const map = new Map<string, { nombre: string; qty: number; total: number }>();
    pagados.forEach((p) => p.items.forEach((i) => {
      const cur = map.get(i.nombre) || { nombre: i.nombre, qty: 0, total: 0 };
      cur.qty += i.cantidad;
      cur.total += i.subtotal;
      map.set(i.nombre, cur);
    }));
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [pagados]);

  const exportCSV = () => {
    const header = "ID,Mesa,Estado,Total,MedioPago,Fecha,Items\n";
    const rows = filtrados.map((p) => `${p.id},${p.mesa},${p.estado},${p.total},${p.medioPago || ""},${p.createdAt},"${p.items.map((i) => `${i.cantidad}x${i.nombre}`).join(" | ")}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gigi-reporte-${filtro}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <h1 className="text-2xl font-black">Reportes <span className="text-[#FF6B00]">— Cierre de caja</span></h1>
        <div className="flex gap-2 flex-wrap">
          {(["hoy", "semana", "mes", "todos"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border capitalize ${filtro === f ? "bg-[#FF6B00] text-white border-[#FF6B00]" : "bg-white hover:bg-zinc-50"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-zinc-500">Ventas {filtro}</p><p className="text-xl font-black">{formatCOP(ventas)}</p><p className="text-xs text-zinc-400">{pagados.length} pedidos pagados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-zinc-500">Efectivo</p><p className="text-xl font-black">{formatCOP(efectivo)}</p><p className="text-xs text-zinc-400">{pagados.filter((p) => p.medioPago === "efectivo").length} pagos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-zinc-500">Transferencia</p><p className="text-xl font-black">{formatCOP(transferencia)}</p><p className="text-xs text-zinc-400">{pagados.filter((p) => p.medioPago === "transferencia").length} pagos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-zinc-500">Ticket promedio</p><p className="text-xl font-black">{formatCOP(ticketPromedio)}</p><p className="text-xs text-zinc-400">Por pedido pagado</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <p className="font-bold">Cierre {filtro} — {filtrados.length} pedidos</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportCSV}>CSV</Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>PDF</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[380px] overflow-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-white sticky top-0">
                  <tr><th className="p-2 text-left">ID/Mesa</th><th className="p-2">Estado</th><th className="p-2">Medio</th><th className="p-2 text-right">Total</th><th className="p-2">Fecha</th></tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-zinc-50">
                      <td className="p-2"><span className="font-bold">{p.id}</span> <span className="text-zinc-500">M{p.mesa}</span></td>
                      <td className="p-2 text-center capitalize text-xs">{p.estado}</td>
                      <td className="p-2 text-center text-xs capitalize">{p.medioPago || "-"}</td>
                      <td className="p-2 text-right font-semibold">{formatCOP(p.total)}</td>
                      <td className="p-2 text-xs">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-zinc-400">Sin datos para {filtro}</td></tr>}
                </tbody>
                {filtrados.length > 0 && (
                  <tfoot className="bg-zinc-50 font-bold">
                    <tr><td colSpan={3} className="p-2 text-right">Total pagado</td><td className="p-2 text-right">{formatCOP(ventas)}</td><td></td></tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><p className="font-bold">Top productos (pagados)</p></CardHeader>
            <CardContent className="space-y-2">
              {topProductos.length === 0 && <p className="text-sm text-zinc-400">Sin ventas aún</p>}
              {topProductos.map((t, i) => (
                <div key={t.nombre} className="flex justify-between items-center bg-zinc-50 rounded-lg p-2">
                  <div className="flex gap-2 items-center"><span className="w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-xs font-black">{i + 1}</span><span className="font-medium text-sm">{t.nombre}</span></div>
                  <div className="text-right"><p className="font-bold text-sm">{t.qty} uds</p><p className="text-xs text-zinc-500">{formatCOP(t.total)}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#FF6B00]/30 bg-orange-50">
            <CardContent className="pt-4">
              <p className="font-bold text-sm">Resumen cierre</p>
              <div className="text-sm mt-2 space-y-1">
                <div className="flex justify-between"><span>Ventas brutas</span><span className="font-bold">{formatCOP(ventas)}</span></div>
                <div className="flex justify-between"><span>Efectivo</span><span>{formatCOP(efectivo)}</span></div>
                <div className="flex justify-between"><span>Transferencia</span><span>{formatCOP(transferencia)}</span></div>
                <div className="border-t pt-2 flex justify-between font-black text-base"><span>Neto caja</span><span>{formatCOP(ventas)}</span></div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">MVP local — luego export Excel/PDF real y Supabase. Usa CSV para contabilidad.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
