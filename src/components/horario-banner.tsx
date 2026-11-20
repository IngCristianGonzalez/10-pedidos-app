"use client";
import { useEffect, useState } from "react";
import { useHorario, formatCountdown, horarioResumen } from "@/lib/horario";

export function HorarioBanner() {
  const { isOpen, nextOpen, horarios, cerradoTemporal, mensajeCerrado } = useHorario();
  const [now, setNow] = useState(new Date());
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { setDismissed(false); }, [isOpen]);

  if (isOpen) {
    return (
      <div className="bg-[#0A0A0A] text-white px-4 py-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Abierto</span>
        <span className="text-white/60 hidden sm:inline">{horarioResumen(horarios)}</span>
        <a href="#menu" className="bg-[#FF6B00] px-4 py-1.5 rounded-full font-bold text-white">Ver menú</a>
      </div>
    );
  }

  const target = nextOpen;
  const countdown = target ? formatCountdown(target, now) : "";
  const diaStr = target ? target.toLocaleDateString("es-CO", { weekday: "long", hour: "2-digit", minute: "2-digit" }) : "";

  if (dismissed) {
    return (
      <div className="bg-[#FF6B00] text-white px-4 py-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />Cerrado {diaStr && `abre ${diaStr}`}</span>
        <button onClick={() => setDismissed(false)} className="bg-black text-white px-3 py-1 rounded-full font-bold">Ver cartel</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden onClick={() => setDismissed(true)} />
      <div className="relative w-full max-w-md rounded-[20px] bg-white shadow-2xl border border-black/10 overflow-hidden text-center">
        <div className="bg-[#0A0A0A] px-5 py-4 flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
          <div className="text-left">
            <p className="text-white font-black leading-none">Gigi Papas</p>
            <p className="text-white/60 text-[11px] tracking-widest uppercase">Comidas Rapidas</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 bg-[#FF6B00] text-white px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Cerrado
          </span>
        </div>
        <div className="px-6 pt-6 pb-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A]">Estamos cerrados</h2>
          <p className="text-sm text-zinc-600 mt-2">{cerradoTemporal ? mensajeCerrado : `Nuestro horario de atención comienza el ${diaStr}.`}</p>
          {target && (
            <div className="mt-4 inline-flex flex-col items-center bg-black rounded-2xl px-6 py-3 w-full">
              <span className="text-xs tracking-widest text-white/60">ABRIMOS EN</span>
              <span className="font-mono font-black text-2xl tracking-widest text-[#FF6B00]">{countdown}</span>
            </div>
          )}
          <p className="text-xs text-zinc-400 mt-4">{horarioResumen(horarios)}</p>
          <button onClick={() => { setDismissed(true); setTimeout(() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="inline-block mt-5 bg-[#FF6B00] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#E55F00] transition w-full">Ver menú abajo</button>
        </div>
      </div>
    </div>
  );
}
