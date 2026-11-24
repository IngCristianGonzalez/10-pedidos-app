"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";

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

function save(cfg: HorarioConfig) {
  try {
    localStorage.setItem(STORAGE_HORARIO, JSON.stringify(cfg));
  } catch {}
}

// Config compartida en Supabase (todos los dispositivos). Fallback: localStorage.
async function loadShared(): Promise<HorarioConfig | null> {
  try {
    const sb = getSupabase();
    if (!sb || !isSupabaseConfigured) return null;
    const { data, error } = await sb.from("negocio_horario").select("*").eq("id", "gigi").single();
    if (error || !data) return null;
    const row = data as { horarios: unknown; cerrado_temporal: boolean | null; mensaje_cerrado: string | null };
    if (!Array.isArray(row.horarios)) return null;
    return {
      horarios: row.horarios as DiaHorario[],
      cerradoTemporal: !!row.cerrado_temporal,
      mensajeCerrado: row.mensaje_cerrado ?? "",
    };
  } catch {
    return null;
  }
}

function saveShared(cfg: HorarioConfig) {
  // Escritura vía servidor (service_role). La key anónima es solo-lectura.
  fetch("/api/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "horario",
      datos: { horarios: cfg.horarios, cerradoTemporal: cfg.cerradoTemporal, mensajeCerrado: cfg.mensajeCerrado },
    }),
  })
    .then((res) =>
      res.json().catch(() => null).then((json) => {
        if (!res.ok || !json?.ok) console.error("[API] negocio_horario:", json?.error || res.status);
      })
    )
    .catch((e) => console.error("[API] negocio_horario:", e));
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

export function countdownParts(target: Date, now = new Date()): { d: number; h: number; m: number; s: number } {
  const diff = Math.max(0, +target - +now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatCountdown(target: Date, now = new Date()): string {
  const { d, h, m, s } = countdownParts(target, now);
  const hhmmss = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  return d > 0 ? `${d}d ${hhmmss}` : hhmmss;
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
  const [cfg, setCfg] = useState<HorarioConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_HORARIO);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return { horarios: DEFAULT_HORARIO, cerradoTemporal: false, mensajeCerrado: "Estamos cerrados temporalmente. Vuelve pronto." };
  });
  const [now, setNow] = useState(new Date());
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  // Sincroniza con Supabase (fuente compartida). Solo aplica si cambió,
  // para no pisar ediciones en curso.
  const syncShared = useCallback(async () => {
    const shared = await loadShared();
    if (shared && JSON.stringify(shared) !== JSON.stringify(cfgRef.current)) {
      save(shared);
      setCfg(shared);
    }
  }, []);

  useEffect(() => {
    syncShared();
    const id = setInterval(() => setNow(new Date()), 1000);
    const idSync = setInterval(syncShared, 30000);
    return () => {
      clearInterval(id);
      clearInterval(idSync);
    };
  }, [syncShared]);

  const persist = (next: HorarioConfig) => {
    setCfg(next);
    save(next);
    saveShared(next);
  };

  const updateHorarios = (h: DiaHorario[]) => {
    persist({ ...cfgRef.current, horarios: h });
  };
  const setCerradoTemporal = (v: boolean) => {
    persist({ ...cfgRef.current, cerradoTemporal: v });
  };
  const setMensajeCerrado = (s: string) => {
    persist({ ...cfgRef.current, mensajeCerrado: s });
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
