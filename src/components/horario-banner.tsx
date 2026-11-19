"use client";
import { useEffect, useState } from "react";
import { useHorario, formatCountdown, horarioResumen } from "@/lib/horario";

export function HorarioBanner() {
  const { isOpen, nextOpen, horarios, cerradoTemporal, mensajeCerrado } = useHorario();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  return (
    <div className="bg-[#FF6B00] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Cerrado
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">Estamos cerrados</h2>
        <p className="text-white/90 text-sm mt-1">{cerradoTemporal ? mensajeCerrado : `Nuestro horario de atención comienza el ${diaStr}.`}</p>
        {target && (
          <div className="mt-3 inline-flex flex-col items-center bg-black rounded-2xl px-6 py-3">
            <span className="text-xs tracking-widest text-white/60">ABRIMOS EN</span>
            <span className="font-mono font-black text-2xl tracking-widest">{countdown}</span>
          </div>
        )}
        <p className="text-xs text-white/70 mt-3">{horarioResumen(horarios)}</p>
        <a href="#menu" className="inline-block mt-4 bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-zinc-100 transition">Ver menú abajo</a>
      </div>
    </div>
  );
}
