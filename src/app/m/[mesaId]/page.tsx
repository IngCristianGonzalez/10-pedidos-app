"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore, calcTotal } from "@/lib/store";
import { formatCOP, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea, Label, Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DetallePedido, EstadoPedido, ESTADOS_COLOR, ESTADOS_LABEL, CategoriaProducto } from "@/types";
import { AlertModal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { HorarioBanner } from "@/components/horario-banner";
import { useHorario } from "@/lib/horario";
import { getDatosTransferencia, TRANSFERENCIA_DEFAULT, type DatosTransferencia } from "@/lib/transferencia";

export default function MesaPublicPage() {
  const params = useParams<{ mesaId: string }>();
  const idOrNumero = decodeURIComponent(params.mesaId || "");
  const { mesas, productos, pedidos, facturas, addPedido, updatePedido, addFactura, ocuparMesa, addTicketCocina } = useStore();
  const { isOpen } = useHorario();
  const [carrito, setCarrito] = useState<DetallePedido[]>([]);
  const [notas, setNotas] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [catActiva, setCatActiva] = useState<string>("todas");
  const [showPago, setShowPago] = useState(false);
  const [referencia, setReferencia] = useState("");
  const [datosTransf, setDatosTransf] = useState<DatosTransferencia>(TRANSFERENCIA_DEFAULT);
  useEffect(() => { setDatosTransf(getDatosTransferencia()); }, []);
  // QR dinámico Nequi (requiere NEXT_PUBLIC_NEQUI_DYNAMIC_QR=1 + credenciales server)
  const NEQUI_DINAMICO = process.env.NEXT_PUBLIC_NEQUI_DYNAMIC_QR === "1";
  const [modoManual, setModoManual] = useState(false);
  const [qrDyn, setQrDyn] = useState<{ qrValue: string; transactionId: string } | null>(null);
  const [qrEstado, setQrEstado] = useState<"idle" | "generando" | "pendiente" | "aprobado" | "expirado" | "rechazado" | "fallido" | "error">("idle");
  const [qrError, setQrError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => stopPoll, []);
  const mesa = mesas.find((m) => m.numero === idOrNumero || m.id === idOrNumero);
  const pedidosMesa = mesa ? pedidos.filter((p) => p.mesa === mesa.numero || p.mesaId === mesa.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const pedidoActivo = pedidosMesa.find((p) => !["pagado", "cancelado"].includes(p.estado));

  const addToCart = (productoId: string) => {
    const p = productos.find((x) => x.id === productoId);
    if (!p || !p.disponible) return;
    setCarrito((prev) => {
      const found = prev.find((i) => i.productoId === p.id);
      if (found) return prev.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * p.precio } : i));
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, subtotal: p.precio }];
    });
  };
  const updateQty = (productoId: string, qty: number) => {
    if (qty <= 0) setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));
    else setCarrito((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: qty, subtotal: qty * i.precio } : i)));
  };

  const handlePedir = () => {
    if (!mesa) return;
    if (carrito.length === 0) { setAlertMsg("Agrega al menos 1 producto al carrito"); return; }
    const total = calcTotal(carrito);
    const pedidoId = uid("PED-");
    const ticketId = uid("TK-");
    const nuevo = {
      id: pedidoId,
      mesa: mesa.numero,
      mesaId: mesa.id,
      items: carrito,
      estado: "pendiente" as EstadoPedido,
      total,
      notas,
      medioPago: null,
      creadoPor: "qr",
      esQr: true,
      ticketCocinaId: ticketId,
      facturaId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ticket = {
      id: ticketId,
      pedidoId,
      mesaId: mesa.id,
      numeroMesa: mesa.numero,
      items: carrito,
      notas,
      impresoEn: null,
      reimpresiones: 0,
      createdAt: new Date().toISOString(),
    };
    addPedido(nuevo);
    addTicketCocina(ticket);
    ocuparMesa(mesa.id, pedidoId);
    setCarrito([]);
    setNotas("");
    setOk(pedidoId);
  };

  const finalizarPrepago = (notaRef: string) => {
    if (!pedidoActivo || pedidoActivo.estado !== "pendiente") return;
    stopPoll();
    const consecutivo = `FAC-${String(facturas.length + 1).padStart(6, "0")}`;
    const subtotal = Math.round(pedidoActivo.total / 1.19);
    const ivaIncluido = pedidoActivo.total - subtotal;
    const facturaId = `FACID-${Date.now()}`;
    addFactura({
      id: facturaId,
      consecutivo,
      pedidoId: pedidoActivo.id,
      mesaId: pedidoActivo.mesaId || "",
      numeroMesa: pedidoActivo.mesa,
      items: pedidoActivo.items,
      subtotal,
      ivaIncluido,
      total: pedidoActivo.total,
      medioPago: "transferencia",
      createdAt: new Date().toISOString(),
      impreso: false,
    });
    updatePedido(pedidoActivo.id, {
      estado: "en_preparacion",
      medioPago: "transferencia",
      facturaId,
      notas: `${pedidoActivo.notas || ""}${notaRef}`.slice(0, 500),
    });
    setShowPago(false);
    setReferencia("");
    setQrDyn(null);
    setQrEstado("idle");
    setModoManual(false);
    setOk(`¡Pago registrado! ${pedidoActivo.id} pasó a preparación.`);
  };

  const handlePagarTransferencia = () => {
    const notaRef = referencia.trim() ? ` | Ref transferencia: ${referencia.trim()}` : " | Pagado por transferencia (QR)";
    finalizarPrepago(notaRef);
  };

  const generarQRDinamico = async () => {
    if (!pedidoActivo || pedidoActivo.estado !== "pendiente") return;
    stopPoll();
    setQrError(null);
    setQrEstado("generando");
    try {
      const res = await fetch("/api/pagos/nequi/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedidoActivo.id, valor: pedidoActivo.total }),
      });
      const json = await res.json();
      if (!json.ok) {
        if (json.error === "no_configurado") { setModoManual(true); setQrEstado("idle"); return; }
        throw new Error(json.error || "No se pudo generar el QR");
      }
      setQrDyn(json.data);
      setQrEstado("pendiente");
      let intentos = 0;
      pollRef.current = setInterval(async () => {
        intentos += 1;
        try {
          const r = await fetch(`/api/pagos/nequi/estado?qrValue=${encodeURIComponent(json.data.qrValue)}`);
          const j = await r.json();
          if (j.ok && j.data?.estado === "aprobado") {
            finalizarPrepago(` | Nequi QR ${json.data.transactionId}`);
            return;
          }
          if (j.ok && ["expirado", "rechazado", "fallido"].includes(j.data?.estado)) {
            stopPoll();
            setQrEstado(j.data.estado);
            return;
          }
        } catch { /* reintenta en el siguiente ciclo */ }
        if (intentos >= 100) {
          stopPoll();
          setQrError("Seguimos esperando confirmación. Si ya pagaste, avisa en caja con tu comprobante.");
        }
      }, 5000);
    } catch (e) {
      setQrEstado("error");
      setQrError((e as Error).message || "Error generando el QR");
    }
  };

  if (!mesa) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="font-semibold tracking-tight">Mesa no encontrada</p>
            <p className="text-sm text-zinc-500 mt-1">Verifica el QR. Mesas validas: 1, 2, 3. Este link es /m/{idOrNumero}.</p>
            <p className="text-xs text-zinc-400 mt-3">Publico sin login escanea QR de mesa para pedir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disponibles = productos.filter((p) => p.disponible);
  const totalCarrito = calcTotal(carrito);
  const categorias: CategoriaProducto[] = ["papas", "hamburguesas", "perros", "salchipapas", "bebidas", "combos", "otros"];
  const productosFiltrados = catActiva === "todas" ? disponibles : disponibles.filter((p) => p.categoria === catActiva);

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <HorarioBanner />
      <header className="sticky top-0 z-20 material border-b border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-9 h-9 rounded-xl object-cover border border-black/10" />
          <div>
            <p className="font-semibold tracking-tight leading-none">Gigi Papas</p>
            <p className="text-[11px] tracking-wide text-zinc-500 uppercase">Mesa {mesa.numero}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${mesa.estado === "disponible" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}>{mesa.estado}</span>
          {pedidoActivo && <Badge className={ESTADOS_COLOR[pedidoActivo.estado]}>{ESTADOS_LABEL[pedidoActivo.estado]}</Badge>}
        </div>
      </header>

      {ok && (
        <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="font-semibold tracking-tight text-emerald-800">Pedido enviado {ok}</p>
          <p className="text-sm text-emerald-700">Recibido en cocina. Te avisamos cuando este listo.</p>
          <Button size="sm" className="mt-2" variant="outline" onClick={() => setOk(null)}>Hacer otro pedido</Button>
        </div>
      )}

      {pedidoActivo && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <Card className="border-[#FF6B00]/20 bg-orange-50/30">
            <CardHeader className="pb-2">
              <p className="font-bold tracking-tight">Estado de tu pedido Mesa {mesa.numero}</p>
              <p className="text-xs text-zinc-500">Mesa {mesa.estado} • {formatDate(pedidoActivo.createdAt)}</p>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm">{pedidoActivo.id}</span>
                    <Badge className={ESTADOS_COLOR[pedidoActivo.estado]}>{ESTADOS_LABEL[pedidoActivo.estado]}</Badge>
                    <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full">{formatCOP(pedidoActivo.total)}</span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-1">{pedidoActivo.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(" • ")}</p>
                  {pedidoActivo.notas && <p className="text-xs text-zinc-400">Notas: {pedidoActivo.notas}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {(["pendiente", "en_preparacion", "listo", "entregado"] as EstadoPedido[]).map((est, idx) => (
                    <div key={est} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${pedidoActivo.estado === est ? "bg-[#FF6B00]" : ["pendiente", "en_preparacion", "listo", "entregado"].indexOf(pedidoActivo.estado) > idx ? "bg-emerald-400" : "bg-zinc-200"}`} />
                      {idx < 3 && <span className="w-4 h-0.5 bg-zinc-200 hidden sm:block" />}
                    </div>
                  ))}
                </div>
              </div>
              {pedidoActivo.medioPago === "transferencia" && pedidoActivo.estado !== "pendiente" && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-sm text-emerald-800">
                  ✅ Pagado por transferencia — tu pedido ya está en cocina.
                </div>
              )}
              {pedidoActivo.estado === "pendiente" && (
                <div className="mt-3">
                  {!showPago ? (
                    <Button className="w-full" variant="outline" onClick={() => { setShowPago(true); setModoManual(false); }}>
                      💳 Pagar por transferencia ({formatCOP(pedidoActivo.total)})
                    </Button>
                  ) : NEQUI_DINAMICO && !modoManual ? (
                    <div className="bg-white border border-purple-200 rounded-xl p-3 space-y-2 text-center">
                      <p className="font-bold text-sm">Pagar con Nequi <span className="text-xs font-normal text-zinc-500">QR con valor exacto</span></p>
                      {qrEstado === "idle" && (
                        <>
                          <p className="text-sm font-bold">Total: {formatCOP(pedidoActivo.total)}</p>
                          <Button className="w-full" onClick={generarQRDinamico}>Generar QR Nequi</Button>
                          <button className="text-xs text-zinc-500 underline" onClick={() => setModoManual(true)}>Prefiero transferir manual al {datosTransf.nequi}</button>
                        </>
                      )}
                      {qrEstado === "generando" && <p className="text-sm text-zinc-500 py-4">Generando tu QR…</p>}
                      {qrEstado === "pendiente" && qrDyn && (
                        <>
                          <div className="flex justify-center bg-white p-2">
                            <QRCodeSVG value={qrDyn.qrValue} size={200} level="M" />
                          </div>
                          <p className="text-sm font-bold">{formatCOP(pedidoActivo.total)}</p>
                          <p className="text-xs text-zinc-600">Escanea con tu app Nequi y confirma. Detectamos el pago solo ⏳</p>
                          {qrError && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{qrError}</p>}
                          <Button variant="ghost" size="sm" onClick={() => { stopPoll(); setQrDyn(null); setQrEstado("idle"); }}>Cancelar</Button>
                        </>
                      )}
                      {(qrEstado === "expirado" || qrEstado === "rechazado" || qrEstado === "fallido") && (
                        <>
                          <p className="text-sm font-bold text-red-700">
                            {qrEstado === "expirado" ? "El QR venció (45 min)." : qrEstado === "rechazado" ? "El pago fue rechazado en Nequi." : "El pago falló."}
                          </p>
                          <Button className="w-full" onClick={generarQRDinamico}>Generar otro QR</Button>
                          <button className="text-xs text-zinc-500 underline" onClick={() => setModoManual(true)}>O transferir manual</button>
                        </>
                      )}
                      {qrEstado === "error" && (
                        <>
                          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{qrError || "Error con Nequi"}</p>
                          <Button className="w-full" onClick={generarQRDinamico}>Reintentar</Button>
                          <button className="text-xs text-zinc-500 underline" onClick={() => setModoManual(true)}>O transferir manual al {datosTransf.nequi}</button>
                        </>
                      )}
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { stopPoll(); setShowPago(false); setQrDyn(null); setQrEstado("idle"); }}>Cerrar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2">
                      <p className="font-bold text-sm">Transferencia {datosTransf.titular}</p>
                      {datosTransf.qrImage && (
                        <div className="flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={datosTransf.qrImage}
                            alt="QR Nequi Gigi Papas"
                            className="w-48 h-48 object-contain rounded-xl border bg-white"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-center text-zinc-500">Escanea para pagar {formatCOP(pedidoActivo.total)}</p>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <p className="text-xs text-zinc-500">Nequi</p>
                          <p className="font-black">{datosTransf.nequi}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <p className="text-xs text-zinc-500">Bancolombia</p>
                          <p className="font-black text-xs">{datosTransf.bancolombia}</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600">{datosTransf.mensaje}</p>
                      <p className="text-sm font-bold">Total a transferir: {formatCOP(pedidoActivo.total)}</p>
                      <div>
                        <Label>Referencia / últimos dígitos (opcional)</Label>
                        <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej: 1234 o comprobante #..." />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handlePagarTransferencia}>Ya pagué, enviar a cocina</Button>
                        <Button variant="ghost" onClick={() => setShowPago(false)}>Cerrar</Button>
                      </div>
                      {NEQUI_DINAMICO && (
                        <button className="text-xs text-purple-700 underline w-full text-center" onClick={() => setModoManual(false)}>
                          Volver al QR Nequi con valor exacto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div id="menu" className="scroll-mt-28" />
      <main className="max-w-6xl mx-auto p-4 grid lg:grid-cols-[1.4fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            <button onClick={() => setCatActiva("todas")} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border ${catActiva === "todas" ? "bg-[#FF6B00] text-white border-[#FF6B00]" : "bg-white border-black/10 hover:bg-zinc-50"}`}>Todas</button>
            {categorias.map((cat) => (
              <button key={cat} onClick={() => setCatActiva(cat)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border capitalize ${catActiva === cat ? "bg-[#FF6B00] text-white border-[#FF6B00]" : "bg-white border-black/10 hover:bg-zinc-50"}`}>{cat}</button>
            ))}
          </div>

          {categorias.filter((cat) => catActiva === "todas" ? productosFiltrados.some((p) => p.categoria === cat) : cat === catActiva).map((cat) => {
            const items = productosFiltrados.filter((p) => p.categoria === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} id={`cat-${cat}`} className="scroll-mt-28">
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-lg font-black capitalize tracking-tight">{cat}</h2>
                  <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full">{items.length} opciones</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map((p) => (
                    <div key={p.id} className="group flex min-w-0 gap-3 rounded-2xl border bg-white p-3 sm:gap-4 sm:p-4 hover:border-[#FF6B00]/30 transition">
                      <button onClick={() => isOpen && addToCart(p.id)} disabled={!isOpen} className="relative size-24 min-[400px]:size-28 sm:size-36 shrink-0 overflow-hidden rounded-xl border bg-zinc-50 disabled:opacity-60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="font-semibold leading-tight line-clamp-1">{p.nombre}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.descripcion}</p>
                        <div className="mt-auto flex justify-between items-end pt-3">
                          <span className="text-lg font-black text-[#FF6B00]">{formatCOP(p.precio)}</span>
                          {isOpen ? (
                            <button onClick={() => addToCart(p.id)} className="rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-black text-white hover:bg-[#E55F00]">Agregar</button>
                          ) : (
                            <span className="rounded-full border bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-500">Cerrado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {productosFiltrados.length === 0 && <p className="text-center text-zinc-400 py-8">Sin productos en {catActiva}</p>}
        </div>

        <Card className="border-[#FF6B00]/20 h-fit sticky top-[68px]">
          <CardHeader><p className="font-semibold tracking-tight">Tu pedido Mesa {mesa.numero}</p></CardHeader>
          <CardContent className="space-y-3">
            {carrito.length === 0 ? <p className="text-sm text-zinc-400 text-center py-6 border-2 border-dashed rounded-2xl">Carrito vacio toca un producto</p> : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {carrito.map((i) => (
                  <div key={i.productoId} className="flex justify-between items-center bg-zinc-50 rounded-xl p-2.5">
                    <div className="flex-1">
                      <p className="font-medium text-sm tracking-tight">{i.nombre}</p>
                      <p className="text-xs text-zinc-500">{formatCOP(i.precio)} x {i.cantidad} = {formatCOP(i.subtotal)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateQty(i.productoId, i.cantidad - 1)}>-</Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{i.cantidad}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQty(i.productoId, i.cantidad + 1)}>+</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div><Label>Notas cocina</Label><Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Sin cebolla, extra queso..." rows={2} /></div>
            <div className="bg-[#1d1d1f] text-white rounded-2xl p-3 flex justify-between items-center"><span className="font-medium">Total</span><span className="font-semibold text-[#FF6B00] tabular-nums">{formatCOP(totalCarrito)}</span></div>
            <Button className="w-full" size="lg" onClick={handlePedir} disabled={carrito.length === 0}>Enviar pedido Mesa {mesa.numero}</Button>
          </CardContent>
        </Card>
      </main>

      <footer className="p-6 text-center text-xs tracking-wide text-zinc-500">Gigi Papas Comidas Rapidas</footer>
      <AlertModal open={!!alertMsg} onClose={() => setAlertMsg(null)} title="Falta agregar productos" description={alertMsg ?? ""} />
    </div>
  );
}
