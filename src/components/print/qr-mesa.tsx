"use client";
import { QRCodeSVG } from "qrcode.react";

export function QRMesaPrint({ numero, url }: { numero: string; url: string }) {
  return (
    <div id={`print-qr-${numero}`} className="bg-white p-6 max-w-[320px] mx-auto text-center border border-black">
      <div className="flex justify-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-16 h-16 rounded-xl object-cover border-2 border-[#FF6B00]" />
      </div>
      <p className="font-black text-xl tracking-tight text-[#FF6B00]">GIGI PAPAS</p>
      <p className="text-xs tracking-widest text-black/60">COMIDAS RAPIDAS</p>
      <div className="bg-black text-white rounded-2xl py-2 px-4 mt-3">
        <p className="font-black text-2xl tracking-tight">MESA {numero}</p>
        <p className="text-xs text-white/70">Escanea para ordenar</p>
      </div>
      <div className="flex justify-center bg-white border-2 border-black rounded-2xl p-3 mt-4">
        <QRCodeSVG value={url} size={180} level="H" includeMargin />
      </div>
      <p className="text-[10px] tracking-wide text-zinc-500 mt-2 break-all">{url}</p>
      <p className="text-xs font-bold mt-2">Escanea el QR y pide sin esperar mesero</p>
      <div className="mt-4 border-t-2 border-dashed border-black pt-3">
        <p className="text-[9px] text-zinc-500">Gigi Papas Comidas Rapidas</p>
        <p className="text-[9px] text-zinc-400">Imprime y pega en la mesa • 80mm</p>
      </div>
    </div>
  );
}
