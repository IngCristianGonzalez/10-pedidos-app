"use client";
import { formatCOP, formatDate } from "@/lib/utils";
import { Factura } from "@/types";

export function FacturaPrint({ factura }: { factura: Factura }) {
  return (
    <div id="print-factura" className="bg-white p-6 max-w-[360px] mx-auto font-mono text-[11px] leading-tight border">
      <div className="text-center border-b border-black pb-2 mb-2">
        <p className="font-bold text-[16px] tracking-tight text-[#FF6B00]">GIGI PAPAS</p>
        <p className="text-[10px] tracking-widest">COMIDAS RAPIDAS — Cliente Duvan Basanta</p>
        <p className="text-[9px]">NIT 900.000.000 — Dir por definir — Tel 300 000 0000</p>
        <p className="font-bold mt-1">FACTURA DE VENTA {factura.consecutivo}</p>
        <p className="text-[10px]">{formatDate(factura.createdAt)} — Mesa {factura.numeroMesa} — Pedido {factura.pedidoId}</p>
      </div>
      <div className="space-y-1">
        {factura.items.map((i) => (
          <div key={i.productoId} className="flex justify-between">
            <span>{i.cantidad}x {i.nombre}</span><span className="tabular-nums">{formatCOP(i.subtotal)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-black mt-2 pt-2 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatCOP(factura.subtotal)}</span></div>
        <div className="flex justify-between text-[10px] text-zinc-600"><span>IVA incluido (19%)</span><span className="tabular-nums">{formatCOP(factura.ivaIncluido)}</span></div>
        <div className="flex justify-between font-bold text-[13px] border-t pt-1"><span>TOTAL</span><span className="tabular-nums">{formatCOP(factura.total)}</span></div>
        <div className="flex justify-between text-[10px]"><span>Medio pago</span><span className="capitalize">{factura.medioPago}</span></div>
      </div>
      <p className="text-center text-[9px] mt-3 border-t border-dashed pt-2">Gracias por tu compra — IVA incluido — Conserve esta factura</p>
      <p className="text-center text-[8px] text-zinc-400">80mm — impresion solo en caja — No valido DIAN hasta Fase 2</p>
    </div>
  );
}
