"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_MESA_COLOR, ESTADOS_MESA_LABEL, Mesa } from "@/types";
import { formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { Input, Label, Select } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export default function MesasPage() {
  const { mesas, updateMesa, deleteMesa, addMesa, pedidos } = useStore();
  const { user } = useAuth();
  const isAdmin = user?.rol === "admin";
  const [numero, setNumero] = useState("");
  const [capacidad, setCapacidad] = useState("4");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const handleToggle = (m: Mesa) => {
    const next = m.estado === "disponible" ? "ocupada" : m.estado === "ocupada" ? "reservada" : "disponible";
    updateMesa(m.id, { estado: next });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = numero.trim();
    if (!num) return setError("Numero requerido");
    if (mesas.some((m) => m.numero === num)) return setError(`Mesa ${num} ya existe`);
    const cap = parseInt(capacidad, 10);
    if (!cap || cap < 1 || cap > 12) return setError("Capacidad 1-12");
    addMesa({ id: `m${Date.now()}`, numero: num, estado: "disponible", capacidad: cap, pedidoActivoIds: [], updatedAt: new Date().toISOString() });
    setNumero("");
    setCapacidad("4");
    setError("");
    setShowForm(false);
  };

  const handleDelete = (m: Mesa) => {
    if (m.pedidoActivoIds.length > 0) return alert("No se puede eliminar mesa con pedidos activos");
    if (!confirm(`Eliminar Mesa ${m.numero}?`)) return;
    deleteMesa(m.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
          <p className="text-sm tracking-tight text-zinc-500">Gestion de mesas y codigos QR — {mesas.length} mesas</p>
        </div>
        <div className="flex gap-2 self-start items-center flex-wrap">
          <span className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-full tabular-nums">{mesas.length} mesas</span>
          <span className="text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full tabular-nums">{mesas.filter((m) => m.estado === "disponible").length} disponibles</span>
          <span className="text-xs bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full tabular-nums">{mesas.filter((m) => m.estado === "ocupada").length} ocupadas</span>
          {isAdmin && <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? "Cerrar" : "+ Nueva mesa"}</Button>}
        </div>
      </div>

      {isAdmin && showForm && (
        <Card className="border-[#FF6B00]/20">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="grid md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <Label>Numero *</Label>
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="4" />
              </div>
              <div className="md:col-span-4">
                <Label>Capacidad</Label>
                <Select value={capacidad} onChange={(e) => setCapacidad(e.target.value)}>
                  {[1,2,3,4,5,6,8,10,12].map((n) => <option key={n} value={String(n)}>{n} personas</option>)}
                </Select>
              </div>
              <div className="md:col-span-4">
                <Button type="submit" className="w-full">Crear mesa</Button>
              </div>
              {error && <p className="md:col-span-12 text-sm text-red-600 bg-red-50 p-2 rounded-xl">{error}</p>}
              <p className="md:col-span-12 text-xs text-zinc-400">Numero unico, genera QR /m/{"{numero}"} automaticamente. Solo admin puede crear.</p>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {mesas.map((m) => {
          const activos = pedidos.filter((p) => m.pedidoActivoIds.includes(p.id));
          return (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="flex flex-row justify-between items-center">
                <p className="font-semibold tracking-tight text-lg">Mesa {m.numero}</p>
                <Badge className={ESTADOS_MESA_COLOR[m.estado]}>{ESTADOS_MESA_LABEL[m.estado]}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Pedidos activos</span><span className="font-semibold tabular-nums">{m.pedidoActivoIds.length}</span>
                </div>
                {activos.length > 0 && (
                  <div className="bg-zinc-50 rounded-xl p-2.5 space-y-1">
                    {activos.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span className="font-medium">{p.id}</span><span className="capitalize">{p.estado}</span><span>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.pedidoActivoIds.length === 0 && <p className="text-xs text-zinc-400 bg-white border border-dashed rounded-xl p-3 text-center">Sin pedidos activos — lista para QR</p>}
                <p className="text-xs text-zinc-400">Actualizado {formatDate(m.updatedAt)}</p>
                <div className="flex justify-center bg-white rounded-2xl p-3 border border-black/[0.06]">
                  <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3003"}/m/${m.numero}`} size={120} level="H" />
                </div>
                <p className="text-[11px] text-center tracking-wide text-zinc-500 break-all">/m/{m.numero}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleToggle(m)}>Cambiar estado</Button>
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => navigator.clipboard?.writeText(`${typeof window !== "undefined" ? window.location.origin : ""}/m/${m.numero}`)}>Copiar link</Button>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="ghost" className="w-full text-red-600 hover:bg-red-50" onClick={() => handleDelete(m)} disabled={m.pedidoActivoIds.length > 0}>
                    Eliminar mesa
                  </Button>
                )}
                {!isAdmin && <p className="text-[11px] text-center text-zinc-400">Solo admin crea/elimina mesas</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-[#FF6B00]/20 bg-orange-50/50">
        <CardContent className="pt-4">
          <p className="text-sm text-zinc-600 tracking-tight">Escanea el QR de la mesa para ver el menu y pedir directamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
