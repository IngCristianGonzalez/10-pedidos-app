// SOLO SERVIDOR — no importar desde componentes cliente ("use client").
// Envuelve la API de Nequi Negocios (QR dinámico) vía @pulgueta/nequi-node.
// Requiere: NEQUI_API_KEY, NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET, NEQUI_MERCHANT_CODE
// Opcional: NEQUI_ENV=development|production (default development)
import { Nequi } from "@pulgueta/nequi-node";

export const NEQUI_CONFIGURADO = Boolean(
  process.env.NEQUI_API_KEY &&
    process.env.NEQUI_CLIENT_ID &&
    process.env.NEQUI_CLIENT_SECRET &&
    process.env.NEQUI_MERCHANT_CODE
);

let client: Nequi | null = null;

function getClient(): Nequi {
  if (!NEQUI_CONFIGURADO) throw new Error("Nequi no configurado: faltan variables NEQUI_*");
  if (!client) {
    client = new Nequi({
      apiKey: process.env.NEQUI_API_KEY!,
      clientId: process.env.NEQUI_CLIENT_ID!,
      clientSecret: process.env.NEQUI_CLIENT_SECRET!,
      env: process.env.NEQUI_ENV === "production" ? "production" : "development",
      timeoutMs: 30000,
    });
  }
  return client;
}

export type EstadoQRNequi = "pendiente" | "aprobado" | "rechazado" | "expirado" | "fallido";

// Códigos de estado Nequi: 33 pendiente, 35 completado, 71 fallido, 10-454 expirado, 10-455 cancelado/rechazado
function mapEstado(status: string): EstadoQRNequi {
  if (status === "35") return "aprobado";
  if (status === "10-454") return "expirado";
  if (status === "10-455") return "rechazado";
  if (status === "71") return "fallido";
  return "pendiente";
}

function unwrap<T>(data: unknown, key: string): T {
  const rs = (data as Record<string, unknown>)?.ResponseMessage as
    | { ResponseBody?: { any?: Record<string, unknown> } }
    | undefined;
  const body = rs?.ResponseBody?.any?.[key];
  if (!body) throw new Error(`Nequi: respuesta sin ${key}`);
  return body as T;
}

export async function generarQRNequi(valor: number, referencia: string) {
  const c = getClient();
  const [error, data] = await c.qr.createQR({
    code: process.env.NEQUI_MERCHANT_CODE!,
    value: String(Math.round(valor)),
    reference1: referencia.slice(0, 30),
    reference2: "Gigi Papas",
  });
  if (error) throw new Error((error as Error).message || "Nequi: no se pudo generar el QR");
  const rs = unwrap<{ qrValue: string; transactionId: string }>(data, "generateCodeQRRS");
  if (!rs.qrValue) throw new Error("Nequi: respuesta sin qrValue");
  return { qrValue: rs.qrValue, transactionId: rs.transactionId };
}

export async function consultarEstadoQRNequi(qrValue: string): Promise<EstadoQRNequi> {
  const c = getClient();
  const [error, data] = await c.qr.getStatus({ qrValue });
  if (error) throw new Error((error as Error).message || "Nequi: no se pudo consultar el estado");
  const rs = unwrap<{ status: string }>(data, "getStatusPaymentRS");
  return mapEstado(rs.status);
}
