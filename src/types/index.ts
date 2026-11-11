export type Rol = "admin" | "mesero" | "cocina" | "caja";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

export type CategoriaProducto = "papas" | "hamburguesas" | "perros" | "salchipapas" | "bebidas" | "combos" | "otros";

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: CategoriaProducto;
  imagen: string;
  disponible: boolean;
  createdAt: string;
};

export type EstadoPedido = "pendiente" | "en_preparacion" | "listo" | "entregado" | "pagado" | "cancelado";

export type MedioPago = "efectivo" | "transferencia" | null;

export type DetallePedido = {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

export type Pedido = {
  id: string;
  mesa: string;
  items: DetallePedido[];
  estado: EstadoPedido;
  total: number;
  notas: string;
  medioPago: MedioPago;
  creadoPor: string; // usuario id
  createdAt: string;
  updatedAt: string;
};

export const ROLES_LABEL: Record<Rol, string> = {
  admin: "Admin",
  mesero: "Mesero",
  cocina: "Cocina",
  caja: "Caja",
};

export const ESTADOS_LABEL: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  listo: "Listo",
  entregado: "Entregado",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

export const ESTADOS_COLOR: Record<EstadoPedido, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  en_preparacion: "bg-orange-100 text-orange-800 border-orange-300",
  listo: "bg-green-100 text-green-800 border-green-300",
  entregado: "bg-blue-100 text-blue-800 border-blue-300",
  pagado: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelado: "bg-red-100 text-red-800 border-red-300",
};
