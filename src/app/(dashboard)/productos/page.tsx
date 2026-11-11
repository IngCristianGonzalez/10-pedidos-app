"use client";
import { useStore } from "@/lib/store";
import { formatCOP } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// eslint-disable-next-line @next/next/no-img-element

export default function ProductosPage() {
  const { productos } = useStore();
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Productos <span className="text-[#FF6B00]">— Menú Gigi</span></h1>
        <span className="text-sm bg-black text-white px-3 py-1 rounded-full">{productos.length} items</span>
      </div>
      <p className="text-sm text-zinc-500">CRUD local con imágenes — próximo commit habilita crear/editar/eliminar.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {productos.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <img src={p.imagen} alt={p.nombre} className="h-36 w-full object-cover" />
            <CardContent>
              <div className="flex justify-between items-start">
                <p className="font-bold leading-tight">{p.nombre}</p>
                <Badge className={p.disponible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{p.disponible ? "Disponible" : "Agotado"}</Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{p.descripcion}</p>
              <p className="font-black text-[#FF6B00] mt-2">{formatCOP(p.precio)}</p>
              <p className="text-xs text-zinc-400 capitalize">{p.categoria}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
