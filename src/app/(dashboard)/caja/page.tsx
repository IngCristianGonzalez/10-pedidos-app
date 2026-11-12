"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { formatCOP, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_COLOR, ESTADOS_LABEL, MedioPago } from "@/types";
import { TicketCocinaPrint } from "@/components/print/ticket-cocina";
import { FacturaPrint } from "@/components/print/factura";
import { printElement } from "@/lib/print";

export default function CajaPage() {
  const { pedidos, updatePedido, ticketsCocina, updateTicketCocina, facturas, addFactura, liberarMesaSiVacia } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [medio, setMedio] = useState<MedioPago>("efectivo");
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [ticketCocinaId, setTicketCocinaId] = useState<string | null>(null);
  const [ultimaFacturaId, setUltimaFacturaId] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const filtrados = pedidos.filter((p) => !["pagado", "cancelado"].includes(p.estado));
  const totalPendiente = filtrados.reduce((a, p) => a + p.total, 0);
  const selected = pedidos.find((p) => p.id === selectedId) || null;
  const selectedTicketCocina = ticketsCocina.find((t) => t.pedidoId === selectedId) || ticketsCocina.find((t) => t.id === ticketCocinaId) || null;
  const ticketsPendientes = ticketsCocina.filter((t) => !t.impresoEn);

  const handleCobrar = () => {
    if (!selected) return;
    if (medio === "efectivo" && efectivoRecibido < selected.total) return alert("Efectivo insuficiente");
    const consecutivo = `FAC-${String(facturas.length + 1).padStart(6, "0")}`;
    const subtotal = Math.round(selected.total / 1.19);
    const ivaIncluido = selected.total - subtotal;
    const facturaId = `FACID-${Date.now()}`;
    const factura = {
      id: facturaId,
      consecutivo,
      pedidoId: selected.id,
      mesaId: selected.mesaId || "",
      numeroMesa: selected.mesa,
      items: selected.items,
      subtotal,
      ivaIncluido,
      total: selected.total,
      medioPago: medio,
      createdAt: new Date().toISOString(),
      impreso: false,
    };
    addFactura(factura);
    updatePedido(selected.id, { estado: "pagado", medioPago: medio, facturaId });
    if (selected.mesaId) liberarMesaSiVacia(selected.mesaId, selected.id);
    setUltimaFacturaId(facturaId);
    setSelectedId(null);
    setEfectivoRecibido(0);
    setTimeout(() => printElement("print-factura"), 200);
  };

  const handlePrint = () => {
    if (ultimaFacturaId) printElement("print-factura");
    else if (selected) printElement("print-factura");
  };
  const handlePrintCocina = (ticketId: string) => {
    setTicketCocinaId(ticketId);
    setTimeout(() => {
      printElement("print-cocina");
      const t = ticketsCocina.find((x) => x.id === ticketId);
      if (t) updateTicketCocina(ticketId, { impresoEn: new Date().toISOString(), reimpresiones: t.impresoEn ? t.reimpresiones + 1 : 0 });
    }, 100);
  };

  const cambio = selected && medio === "efectivo" ? Math.max(0, efectivoRecibido - selected.total) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Caja</h1>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="bg-black text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Por cobrar</p>
            <p className="text-2xl font-semibold tabular-nums">{formatCOP(totalPendiente)}</p>
            <p className="text-xs text-white/50 mt-1 tabular-nums">{filtrados.length} pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Tickets cocina</p>
            <p className="text-xl font-semibold tabular-nums">{ticketsPendientes.length} por imprimir</p>
            <p className="text-xs text-zinc-400">Se entrega en cocina</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500">Facturas</p>
            <p className="text-xl font-semibold tabular-nums">{facturas.length} generadas</p>
            <p className="text-xs text-zinc-400">Impresion en caja</p>
          </CardContent>
        </Card>
      </div>

      {ticketsPendientes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader><p className="font-semibold tracking-tight">Tickets cocina ({ticketsPendientes.length})</p></CardHeader>
          <CardContent className="space-y-2">
            {ticketsPendientes.map((t) => (
              <div key={t.id} className="flex justify-between items-center bg-white border rounded-xl p-3">
                <div>
                  <p className="font-medium text-sm">Mesa {t.numeroMesa} — {t.pedidoId}</p>
                  <p className="text-xs text-zinc-500">{t.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(" • ")} • {formatDate(t.createdAt)}</p>
                </div>
                <Button size="sm" onClick={() => handlePrintCocina(t.id)}>Imprimir cocina</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* Lista */}
        <Card>
          <CardHeader>
            <p className="font-semibold tracking-tight">Pedidos por cobrar</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[520px] overflow-auto">
            {filtrados.length === 0 && <p className="text-sm text-zinc-400 text-center py-8 border-2 border-dashed rounded-2xl">Todo cobrado</p>}
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left border rounded-xl p-3 flex justify-between items-center transition ${selectedId === p.id ? "border-[#FF6B00] bg-orange-50" : "hover:bg-zinc-50"}`}
              >
                <div>
                  <p className="font-bold">Mesa {p.mesa} • {p.id}</p>
                  <p className="text-xs text-zinc-500 truncate max-w-[220px]">{p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(" • ")}</p>
                  <p className="text-xs text-zinc-400">{formatDate(p.createdAt)}</p>
                </div>
                <div className="text-right">
                  <Badge className={ESTADOS_COLOR[p.estado]}>{ESTADOS_LABEL[p.estado]}</Badge>
                  <p className="font-black mt-1">{formatCOP(p.total)}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Cobro */}
        <Card className="border-[#FF6B00]/30">
          <CardHeader>
            <p className="font-bold">Cobro</p>
            {selected ? <p className="text-sm text-zinc-500">Seleccionado: <b>{selected.id}</b> — Mesa {selected.mesa}</p> : <p className="text-sm text-zinc-400">Selecciona un pedido</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <p className="text-sm text-zinc-400 text-center py-10 border-2 border-dashed rounded-xl">Ningún pedido seleccionado</p>
            ) : (
              <>
                <div className="bg-zinc-50 rounded-xl p-3 space-y-1">
                  {selected.items.map((i) => (
                    <div key={i.productoId} className="flex justify-between text-sm">
                      <span>{i.cantidad}x {i.nombre}</span><span>{formatCOP(i.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-black text-lg">
                    <span>Total</span><span className="text-[#FF6B00]">{formatCOP(selected.total)}</span>
                  </div>
                  {selected.notas && <p className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2 tracking-tight">Notas: {selected.notas}</p>}
                </div>

                <div>
                  <Label>Medio de pago *</Label>
                  <Select value={medio || "efectivo"} onChange={(e) => setMedio(e.target.value as MedioPago)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </Select>
                </div>

                {medio === "efectivo" && (
                  <div>
                    <Label>Efectivo recibido</Label>
                    <Input type="number" value={efectivoRecibido} onChange={(e) => setEfectivoRecibido(Number(e.target.value))} placeholder="50000" />
                    <div className="mt-2 bg-black text-white rounded-lg p-3 flex justify-between">
                      <span>Cambio</span><span className="font-black text-[#FF6B00]">{formatCOP(cambio)}</span>
                    </div>
                    {efectivoRecibido > 0 && efectivoRecibido < selected.total && <p className="text-xs text-red-600 mt-1">Falta {formatCOP(selected.total - efectivoRecibido)}</p>}
                  </div>
                )}

                {medio === "transferencia" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="font-bold">Transferencia — Gigi Papas</p>
                    <p className="text-xs text-zinc-600">Nequi / Bancolombia — confirmar comprobante antes de cobrar</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" size="lg" onClick={handleCobrar}>Cobrar {formatCOP(selected.total)}</Button>
                  <Button variant="outline" onClick={handlePrint}>Ticket</Button>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setSelectedId(null)}>Cancelar</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket cocina printable (solo caja) */}
      <div className="hidden print:block">
        {ticketsCocina.map((t) => (
          <div key={t.id} className={ticketCocinaId === t.id ? "block" : "hidden"}>
            <TicketCocinaPrint ticket={t} />
          </div>
        ))}
      </div>
      {selectedTicketCocina && (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center">
          <p className="text-sm">Ticket cocina para {selectedTicketCocina.pedidoId} — Mesa {selectedTicketCocina.numeroMesa} {selectedTicketCocina.impresoEn ? `impreso ${formatDate(selectedTicketCocina.impresoEn)}` : "pendiente"}</p>
          <Button size="sm" variant="outline" onClick={() => handlePrintCocina(selectedTicketCocina.id)}>{selectedTicketCocina.impresoEn ? "Reimprimir cocina" : "Imprimir cocina"}</Button>
        </div>
      )}

      {/* Factura imprimible - solo caja */}
      {ultimaFacturaId ? (
        (() => {
          const fac = facturas.find((f) => f.id === ultimaFacturaId);
          if (!fac) return null;
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium tracking-tight">Ultima factura {fac.consecutivo} generada — Mesa {fac.numeroMesa}</p>
              <FacturaPrint factura={fac} />
              <div className="flex gap-2 no-print">
                <Button size="sm" variant="outline" onClick={() => printElement("print-factura")}>Reimprimir factura</Button>
                <Button size="sm" variant="ghost" onClick={() => setUltimaFacturaId(null)}>Cerrar</Button>
              </div>
            </div>
          );
        })()
      ) : selected ? (
        <div id="print-factura-preview" ref={ticketRef} className="bg-white border rounded-xl p-6 max-w-[360px] mx-auto">
          <div className="text-center border-b border-dashed pb-3 mb-3">
            <p className="font-bold text-lg tracking-tight text-[#FF6B00]">GIGI PAPAS</p>
            <p className="text-xs tracking-widest">COMIDAS RAPIDAS</p>
            <p className="text-xs text-zinc-500">Preview factura — genera al cobrar</p>
            <p className="text-xs">Pedido: {selected.id} • Mesa {selected.mesa}</p>
            <p className="text-xs text-zinc-400">{formatDate(selected.createdAt)}</p>
          </div>
          <div className="space-y-1 text-sm">
            {selected.items.map((i) => (
              <div key={i.productoId} className="flex justify-between">
                <span>{i.cantidad}x {i.nombre}</span><span className="tabular-nums">{formatCOP(i.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between font-semibold text-base"><span>TOTAL IVA incluido</span><span className="tabular-nums">{formatCOP(selected.total)}</span></div>
            <div className="flex justify-between text-xs"><span>Medio</span><span className="capitalize">{medio}</span></div>
            {selected.notas && <p className="text-xs mt-2">Notas: {selected.notas}</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
