"use client";
import { formatDate } from "@/lib/utils";
import { TicketCocina } from "@/types";

export function TicketCocinaPrint({ ticket }: { ticket: TicketCocina }) {
  return (
    <div id="print-cocina" className="bg-white p-6 max-w-[320px] mx-auto font-mono text-[11px] leading-tight">
      <div className="text-center border-b-2 border-black border-dashed pb-2 mb-2">
        <p className="font-bold text-[16px] tracking-tight">GIGI PAPAS</p>
        <p className="text-[10px] tracking-widest">COCINA — TICKET</p>
        <p className="font-bold text-[14px] mt-1">MESA {ticket.numeroMesa}</p>
        <p className="text-[10px]">{ticket.pedidoId} • {formatDate(ticket.createdAt)}</p>
        <p className="text-[10px]">Impresion caja — llevar a cocina</p>
      </div>
      <div className="space-y-1">
        {ticket.items.map((i) => (
          <div key={i.productoId} className="flex justify-between border-b border-dotted border-zinc-300 py-1">
            <span className="font-bold">{i.cantidad}x {i.nombre}</span>
            <span>{i.cantidad}</span>
          </div>
        ))}
      </div>
      {ticket.notas && (
        <div className="mt-2 border border-black p-2">
          <p className="font-bold">NOTAS:</p>
          <p className="whitespace-pre-wrap">{ticket.notas}</p>
        </div>
      )}
      <div className="text-center border-t-2 border-black border-dashed mt-3 pt-2">
        <p className="font-bold">*** CORTAR AQUI ***</p>
        <p className="text-[9px]">Ticket completo por pedido — 80mm — IVA incluido</p>
        <p className="text-[9px]">Reimpresiones: {ticket.reimpresiones}</p>
      </div>
    </div>
  );
}
