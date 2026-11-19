"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type DiaHorario = { dia: number; abre: string; cierra: string; activo: boolean }; // dia 0=Dom
const STORAGE_HORARIO = "gigi_horario";

const DEFAULT_HORARIO: DiaHorario[] = [
  { dia: 0, abre: "18:00", cierra: "23:00", activo: true }, // Dom
  { dia: 1, abre: "18:00", cierra: "23:00", activo: false },
  { dia: 2, abre: "18:00", cierra: "23:00", activo: false },
  { dia: 3, abre: "18:00", cierra: "23:00", activo: false },
  { dia: 4, abre: "18:00", cierra: "23:00", activo: false },
  { dia: 5, abre: "18:00", cierra: "22:30", activo: true }, // Vie
  { dia: 6, abre: "18:00", cierra: "23:00", activo: true }, // Sab
];

type HorarioConfig = { horarios: DiaHorario[]; cerradoTemporal: boolean; mensajeCerrado: string };

function load(): HorarioConfig {
  try {
    const raw = localStorage.getItem(STORAGE_HORARIO);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { horarios: DEFAULT_HORARIO, cerradoTemporal: false, mensajeCerrado: "Estamos cerrados temporalmente. Vuelve pronto." };
}
function save(cfg: HorarioConfig) {
  localStorage.setItem(STORAGE_HORARIO, JSON.stringify(cfg));
}

export function isOpenNow(cfg: HorarioConfig, now = new Date()): boolean {
  if (cfg.cerradoTemporal) return false;
  const dia = now.getDay();
  const h = cfg.horarios.find((x) => x.dia === dia);
  if (!h || !h.activo) return false;
  const [ah, am] = h.abre.split(":").map(Number);
  const [ch, cm] = h.cierra.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const openMins = ah * 60 + am;
  const closeMins = ch * 60 + cm;
  return mins >= openMins && mins < closeMins;
}

export function nextOpening(cfg: HorarioConfig, now = new Date()): Date | null {
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dia = d.getDay();
    const h = cfg.horarios.find((x) => x.dia === dia);
    if (!h || !h.activo) continue;
    const [ah, am] = h.abre.split(":").map(Number);
    const open = new Date(d);
    open.setHours(ah, am, 0, 0);
    if (i === 0) {
      const [ch, cm] = h.cierra.split(":").map(Number);
      const close = new Date(d);
      close.setHours(ch, cm, 0, 0);
      if (now < open) return open;
      if (now >= open && now < close) return null;
    } else return open;
  }
  return null;
}

export function formatCountdown(target: Date, now = new Date()): string {
  const diff = Math.max(0, +target - +now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Ctx = HorarioConfig & {
  updateHorarios: (h: DiaHorario[]) => void;
  setCerradoTemporal: (v: boolean) => void;
  setMensajeCerrado: (s: string) => void;
  isOpen: boolean;
  nextOpen: Date | null;
};
const HorarioCtx = createContext<Ctx | null>(null);

export function HorarioProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<HorarioConfig>({ horarios: DEFAULT_HORARIO, cerradoTemporal: false, mensajeCerrado: "Estamos cerrados temporalmente. Vuelve pronto." });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setCfg(load());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const updateHorarios = (h: DiaHorario[]) => {
    const next = { ...cfg, horarios: h };
    setCfg(next);
    save(next);
  };
  const setCerradoTemporal = (v: boolean) => {
    const next = { ...cfg, cerradoTemporal: v };
    setCfg(next);
    save(next);
  };
  const setMensajeCerrado = (s: string) => {
    const next = { ...cfg, mensajeCerrado: s };
    setCfg(next);
    save(next);
  };

  return (
    <HorarioCtx.Provider value={{ ...cfg, updateHorarios, setCerradoTemporal, setMensajeCerrado, isOpen: isOpenNow(cfg, now), nextOpen: nextOpening(cfg, now) }}>
      {children}
    </HorarioCtx.Provider>
  );
}

export function useHorario() {
  const ctx = useContext(HorarioCtx);
  if (!ctx) throw new Error("useHorario must be within HorarioProvider");
  return ctx;
}

export function horarioResumen(horarios: DiaHorario[]): string {
  const activos = horarios.filter((h) => h.activo);
  if (activos.length === 0) return "Cerrado";
  return activos.map((h) => `${DIAS[h.dia].slice(0, 3)}: ${h.abre}–${h.cierra}`).join(" · ");
}

export { DIAS };
