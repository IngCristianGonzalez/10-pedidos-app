"use client";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_MESA_COLOR, ESTADOS_MESA_LABEL, Mesa } from "@/types";
import { formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export default function MesasPage() {
  const { mesas, updateMesa, pedidos } = useStore();

  const handleToggle = (m: Mesa) => {
    const next = m.estado === "disponible" ? "ocupada" : m.estado === "ocupada" ? "reservada" : "disponible";
    updateMesa(m.id, { estado: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas <span className="text-[#FF6B00]">— Gigi Papas</span></h1>
          <p className="text-sm tracking-tight text-zinc-500">3 mesas • QR por mesa en siguiente entrega • Estado local, auto-libera al pagar</p>
        </div>
        <div className="flex gap-2 self-start">
          <span className="text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">{mesas.filter((m) => m.estado === "disponible").length} disponibles</span>
          <span className="text-xs bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">{mesas.filter((m) => m.estado === "ocupada").length} ocupadas</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {mesas.map((m) => {
          const activos = pedidos.filter((p) => m.pedidoActivoIds.includes(p.id));
          return (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="flex flex-row justify-between items-center">
                <p className="font-semibold tracking-tight text-lg">Mesa {m.numero}</p>
                <Badge className={ESTADOS_MESA_COLOR[m.estado]}>{ESTADOS_MESA_LABEL[m.estado]}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Capacidad</span><span className="font-medium tabular-nums">{m.capacidad} pax</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Pedidos activos</span><span className="font-semibold">{m.pedidoActivoIds.length}</span>
                </div>
                {activos.length > 0 && (
                  <div className="bg-zinc-50 rounded-xl p-2.5 space-y-1">
                    {activos.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span className="font-medium">{p.id}</span><span className="capitalize">{p.estado}</span><span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.pedidoActivoIds.length === 0 && <p className="text-xs text-zinc-400 bg-white border border-dashed rounded-xl p-3 text-center">Sin pedidos activos — lista para QR</p>}
                <p className="text-xs text-zinc-400">Actualizado {formatDate(m.updatedAt)}</p>
                <div className="flex justify-center bg-white rounded-2xl p-3 border border-black/[0.06]">
                  <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3003"}/m/${m.numero}`} size={120} level="H" />
                </div>
                <p className="text-[11px] text-center tracking-wide text-zinc-500 break-all">/m/{m.numero} — escanea para pedir sin mesero</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleToggle(m)}>Cambiar estado</Button>
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => navigator.clipboard?.writeText(`${typeof window !== "undefined" ? window.location.origin : ""}/m/${m.numero}`)}>Copiar link</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-[#FF6B00]/20 bg-orange-50/50">
        <CardContent className="pt-4">
          <p className="font-medium text-sm tracking-tight">Flujo</p>
          <p className="text-sm text-zinc-600 tracking-tight">QR escanea → pide sin mesero → múltiples pedidos por mesa permitidos → ticket cocina completo impreso en caja → factura en caja → al pagar ultimo pedido mesa pasa a disponible automaticamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
