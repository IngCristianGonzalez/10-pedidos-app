import type { EstadoPedido } from "@/types";

// Transiciones válidas de estado. Todo cambio pasa por el servidor.
const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ["en_preparacion", "cancelado"],
  en_preparacion: ["listo", "pendiente", "cancelado"],
  listo: ["entregado", "en_preparacion"],
  entregado: ["pagado"],
  pagado: [],
  cancelado: [],
};

export function esTransicionValida(de: EstadoPedido, a: EstadoPedido): boolean {
  return (TRANSICIONES[de] ?? []).includes(a);
}

export function puedeEditarPedido(estado: EstadoPedido): boolean {
  return estado !== "pagado" && estado !== "cancelado";
}
