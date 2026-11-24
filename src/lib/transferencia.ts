"use client";

export type DatosTransferencia = {
  titular: string;
  nequi: string;
  bancolombia: string;
  mensaje: string;
  qrImage: string; // "/images/nequi-qr.jpeg" del repo o dataURL subido desde admin
};

export const TRANSFERENCIA_DEFAULT: DatosTransferencia = {
  titular: "Gigi Papas",
  nequi: "3023860980",
  bancolombia: "Ahorros 123-456789-00",
  mensaje: "Escanea el QR o transfiere al Nequi, envía el comprobante por WhatsApp y pulsa “Ya pagué”. Tu pedido pasa directo a preparación.",
  qrImage: "/images/nequi-qr.jpeg",
};

const KEY = "gigi_transferencia_datos";

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
