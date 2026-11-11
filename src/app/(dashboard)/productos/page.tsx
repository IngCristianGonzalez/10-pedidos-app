"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatCOP } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Producto, CategoriaProducto } from "@/types";
import { useAuth } from "@/lib/auth";

const CATEGORIAS: CategoriaProducto[] = ["papas", "hamburguesas", "perros", "salchipapas", "bebidas", "combos", "otros"];

export default function ProductosPage() {
  const { productos, addProducto, updateProducto, deleteProducto } = useStore();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [editing, setEditing] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Producto, "id" | "createdAt">>({
    nombre: "",
    descripcion: "",
    precio: 0,
    categoria: "otros",
    imagen: "",
    disponible: true,
  });

  const filtrados = productos.filter((p) => {
    const matchCat = cat === "todas" || p.categoria === cat;
    const matchQuery = p.nombre.toLowerCase().includes(query.toLowerCase()) || p.descripcion.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) return;
    if (editing) {
      updateProducto(editing.id, form);
      setEditing(null);
    } else {
      const nuevo: Producto = {
        id: `p${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...form,
        imagen: form.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      };
      addProducto(nuevo);
    }
    setForm({ nombre: "", descripcion: "", precio: 0, categoria: "otros", imagen: "", disponible: true });
    setShowForm(false);
  };

  const handleEdit = (p: Producto) => {
    setEditing(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, categoria: p.categoria, imagen: p.imagen, disponible: p.disponible });
    setShowForm(true);
  };

  const canEdit = user?.rol === "admin";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Productos <span className="text-[#FF6B00]">— Menú Gigi</span></h1>
        <div className="flex gap-2">
          <span className="bg-black text-white px-3 py-1.5 rounded-full text-sm self-center">{productos.length} items • {filtrados.length} filtrados</span>
          {canEdit && <Button onClick={() => { setEditing(null); setForm({ nombre: "", descripcion: "", precio: 0, categoria: "otros", imagen: "", disponible: true }); setShowForm(!showForm); }}>{showForm ? "Cerrar" : "+ Nuevo"}</Button>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <Input placeholder="Buscar papas, hamburguesa..." value={query} onChange={(e) => setQuery(e.target.value)} className="md:max-w-sm" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </Select>
      </div>

      {showForm && canEdit && (
        <Card className="border-[#FF6B00]/30">
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Papas Gigi Especial" required />
              </div>
              <div>
                <Label>Precio COP *</Label>
                <Input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaProducto })}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Disponible</Label>
                <Select value={String(form.disponible)} onChange={(e) => setForm({ ...form, disponible: e.target.value === "true" })}>
                  <option value="true">Sí</option>
                  <option value="false">No (agotado)</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción corta" rows={2} />
              </div>
              <div className="md:col-span-2">
                <Label>URL Imagen</Label>
                <Input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} placeholder="https://..." />
                <p className="text-xs text-zinc-400 mt-1">Vacío = placeholder. Luego Supabase Storage.</p>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">{editing ? "Actualizar" : "Crear producto"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {filtrados.map((p) => (
          <Card key={p.id} className="overflow-hidden flex flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imagen} alt={p.nombre} className="h-40 w-full object-cover" />
            <CardContent className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2">
                <p className="font-bold leading-tight">{p.nombre}</p>
                <Badge className={p.disponible ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>{p.disponible ? "Disponible" : "Agotado"}</Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.descripcion}</p>
              <p className="font-black text-[#FF6B00] mt-2 text-lg">{formatCOP(p.precio)}</p>
              <p className="text-xs text-zinc-400 capitalize mb-3">{p.categoria}</p>
              {canEdit && (
                <div className="mt-auto flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(p)}>Editar</Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 flex-1" onClick={() => { if (confirm(`Eliminar ${p.nombre}?`)) deleteProducto(p.id); }}>Eliminar</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {filtrados.length === 0 && <p className="text-center text-zinc-500 py-8">Sin resultados para &quot;{query}&quot;</p>}
      {!canEdit && <p className="text-xs text-center text-zinc-400">Solo rol <b>admin</b> puede crear/editar. Entra como admin@gigipapas.com</p>}
    </div>
  );
}
