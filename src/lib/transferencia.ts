"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type DatosTransferencia = {
  titular: string;
  nequi: string;
  bancolombia: string;
  mensaje: string;
  qrImage: string; // URL pública Supabase Storage, dataURL local o "" (sin QR)
};

export const TRANSFERENCIA_DEFAULT: DatosTransferencia = {
  titular: "Gigi Papas",
  nequi: "3023860980",
  bancolombia: "Ahorros 123-456789-00",
  mensaje: "Escanea el QR o transfiere al Nequi, envía el comprobante por WhatsApp y pulsa “Ya pagué”. Tu pedido pasa directo a preparación.",
  qrImage: "",
};

const KEY = "gigi_transferencia_datos";

// Fallback local (navegador) cuando Supabase no está configurado
export function getDatosTransferencia(): DatosTransferencia {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...TRANSFERENCIA_DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return TRANSFERENCIA_DEFAULT;
}

export function saveDatosTransferencia(d: DatosTransferencia) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}

type NegocioRow = {
  titular: string | null;
  nequi: string | null;
  bancolombia: string | null;
  mensaje: string | null;
  qr_image: string | null;
};

function rowADatos(row: NegocioRow): DatosTransferencia {
  return {
    titular: row.titular || TRANSFERENCIA_DEFAULT.titular,
    nequi: row.nequi || TRANSFERENCIA_DEFAULT.nequi,
    bancolombia: row.bancolombia ?? TRANSFERENCIA_DEFAULT.bancolombia,
    mensaje: row.mensaje || TRANSFERENCIA_DEFAULT.mensaje,
    qrImage: row.qr_image || "",
  };
}

// Config compartida: Supabase (todos los dispositivos) con fallback a localStorage
export function useNegocioConfig() {
  const [datos, setDatos] = useState<DatosTransferencia>(TRANSFERENCIA_DEFAULT);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const sb = getSupabase();
      if (sb && isSupabaseConfigured) {
        try {
          const { data, error } = await sb.from("negocio_config").select("*").eq("id", "gigi").single();
          if (!cancel && !error && data) {
            setDatos(rowADatos(data as NegocioRow));
            setCargando(false);
            return;
          }
        } catch {}
      }
      if (!cancel) {
        setDatos(getDatosTransferencia());
        setCargando(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const guardar = useCallback(async (d: DatosTransferencia) => {
    setDatos(d);
    saveDatosTransferencia(d);
    const sb = getSupabase();
    if (sb && isSupabaseConfigured) {
      await sb.from("negocio_config").upsert(
        {
          id: "gigi",
          titular: d.titular,
          nequi: d.nequi,
          bancolombia: d.bancolombia,
          mensaje: d.mensaje,
          qr_image: d.qrImage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }
  }, []);

  return { datos, setDatos, guardar, cargando };
}

// Sube el QR al Storage compartido y devuelve la URL pública.
// Si Supabase no está disponible, devuelve dataURL local (solo visible en ese navegador).
export async function subirQRNegocio(file: File): Promise<string> {
  const sb = getSupabase();
  if (sb && isSupabaseConfigured) {
    const ext = file.type.includes("png") ? "png" : "jpeg";
    const { error } = await sb.storage
      .from("negocio")
      .upload("nequi-qr.jpeg", file, { upsert: true, cacheControl: "0", contentType: file.type || "image/jpeg" });
    if (error) throw error;
    const { data } = sb.storage.from("negocio").getPublicUrl(`nequi-qr.jpeg`);
    void ext;
    return `${data.publicUrl}?t=${Date.now()}`;
  }
  // Fallback local: comprime a dataURL
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  const max = 640;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}
