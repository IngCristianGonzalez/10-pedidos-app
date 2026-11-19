"use client";
import { useState, useEffect } from "react";
import { useAuth, generateTOTP } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { AlertModal } from "@/components/ui/modal";
import { useHorario, DIAS } from "@/lib/horario";
import { Textarea } from "@/components/ui/input";

export default function CuentaPage() {
  const { user, changePassword, is2FAEnabled, get2FASecret, setup2FA, confirm2FA, disable2FA } = useAuth();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [msg, setMsg] = useState<{ title: string; desc: string } | null>(null);
  const [error, setError] = useState("");

  // 2FA
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [liveCode, setLiveCode] = useState("");
  const enabled = user ? is2FAEnabled(user.id) : false;

  useEffect(() => {
    if (enabled) {
      const s = get2FASecret();
      if (s) {
        setSecret(s);
        const tick = () => setLiveCode(generateTOTP(s));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
      }
    }
  }, [enabled, get2FASecret]);

  const handleChangePass = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPass !== confirmPass) { setError("La nueva contraseña no coincide"); return; }
    const res = changePassword(oldPass, newPass);
    if (!res.ok) setError(res.error ?? "Error");
    else {
      setMsg({ title: "Contraseña actualizada", desc: "Tu contraseña se cambió correctamente." });
      setOldPass(""); setNewPass(""); setConfirmPass("");
    }
  };

  const handleSetup = () => {
    const s = setup2FA();
    setSecret(s);
    setLiveCode(generateTOTP(s));
  };

  const handleConfirm = () => {
    if (!secret) return;
    const ok = confirm2FA(code);
    if (!ok) setError("Código incorrecto o expirado. Intenta con el código actual.");
    else {
      setMsg({ title: "2FA activado", desc: "Autenticación en dos pasos habilitada para admin. En el próximo login se pedirá el código." });
      setCode("");
    }
  };

  const handleDisable = () => {
    disable2FA();
    setMsg({ title: "2FA desactivado", desc: "Se deshabilitó la verificación en dos pasos." });
  };

  const horario = useHorario();
  const [localHorarios, setLocalHorarios] = useState(horario.horarios);
  useEffect(() => { setLocalHorarios(horario.horarios); }, [horario.horarios]);

  if (!user) return <p className="p-8 text-center">Cargando...</p>;

  const otpauth = secret ? `otpauth://totp/GigiPapas:${user.email}?secret=${secret}&issuer=GigiPapas` : "";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black tracking-tight">Mi cuenta <span className="text-[#FF6B00]">Gigi Papas</span></h1>
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-gigi.jpeg" alt="Gigi" className="w-12 h-12 rounded-xl object-cover border" />
          <div>
            <p className="font-bold">{user.nombre}</p>
            <p className="text-sm text-zinc-500">{user.email} • <span className="capitalize">{user.rol}</span></p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#FF6B00]/20">
        <CardHeader>
          <p className="font-bold">Cambiar contraseña</p>
          <p className="text-sm text-zinc-500">Actualiza tu contraseña.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePass} className="space-y-3">
            <div>
              <Label>Contraseña actual</Label>
              <Input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Actual" required />
            </div>
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mínimo 4 caracteres" required />
            </div>
            <div>
              <Label>Confirmar nueva</Label>
              <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Repite nueva" required />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-xl">{error}</p>}
            <Button type="submit" className="w-full">Actualizar contraseña</Button>
          </form>
        </CardContent>
      </Card>

      {user.rol === "admin" ? (
        <Card className="border-black/10">
          <CardHeader>
            <p className="font-bold flex items-center gap-2">Autenticación en dos pasos <span className={`text-xs px-2 py-1 rounded-full border ${enabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>{enabled ? "Activado" : "Desactivado"}</span></p>
            <p className="text-sm text-zinc-500">Solo admin. Genera un código TOTP de 6 dígitos que cambia cada 30s. Compatible con Google Authenticator / Authy.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!enabled ? (
              <>
                {!secret ? (
                  <Button onClick={handleSetup} className="w-full">Generar clave 2FA</Button>
                ) : (
                  <>
                    <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-medium text-zinc-600">Escanea este QR en tu app autenticadora:</p>
                      <div className="flex justify-center bg-white p-3 rounded-xl border">
                        <QRCodeSVG value={otpauth} size={160} level="M" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">Clave manual (si no escaneas):</p>
                        <p className="font-mono font-bold tracking-widest text-sm bg-black text-white inline-block px-3 py-1 rounded-lg mt-1">{secret}</p>
                      </div>
                      <div className="text-center pt-2">
                        <p className="text-xs text-zinc-500">Código actual (30s):</p>
                        <p className="font-mono font-black text-2xl tracking-widest text-[#FF6B00]">{generateTOTP(secret)}</p>
                      </div>
                    </div>
                    <div>
                      <Label>Confirma el código para activar</Label>
                      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} />
                      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-xl mt-2">{error}</p>}
                      <Button onClick={handleConfirm} className="w-full mt-2">Confirmar y activar 2FA</Button>
                      <p className="text-xs text-zinc-400 mt-2">Ingresa el código de 6 dígitos de tu app para verificar.</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                  <p className="text-sm font-bold text-emerald-800">2FA activo</p>
                  <p className="text-xs text-zinc-600">Código actual:</p>
                  <p className="font-mono font-black text-3xl tracking-widest text-[#FF6B00]">{liveCode}</p>
                  <p className="text-xs text-zinc-500">Cambia cada 30s úsalo en el login</p>
                  {secret && (
                    <div className="pt-2">
                      <p className="text-xs text-zinc-500">QR / clave:</p>
                      <div className="flex justify-center mt-2"><QRCodeSVG value={otpauth} size={120} /></div>
                      <p className="font-mono text-xs mt-2">{secret}</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={handleDisable} className="w-full text-red-600 hover:bg-red-50">Desactivar 2FA</Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-50 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500 text-center">La autenticación en dos pasos está disponible solo para el rol <b>admin</b>.</p>
          </CardContent>
        </Card>
      )}

      {user.rol === "admin" && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <p className="font-black">Horarios de atención</p>
            <p className="text-sm text-zinc-500">Solo admin. Define cuándo el local está abierto. Si está cerrado se muestra cartel con contador y ver menú abajo.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={horario.cerradoTemporal} onChange={(e) => horario.setCerradoTemporal(e.target.checked)} />
              Cerrado temporalmente
            </label>
            {horario.cerradoTemporal && (
              <div>
                <Label>Mensaje cerrado temporal</Label>
                <Textarea value={horario.mensajeCerrado} onChange={(e) => horario.setMensajeCerrado(e.target.value)} rows={2} />
              </div>
            )}
            <div className="space-y-2">
              {localHorarios.map((h) => (
                <div key={h.dia} className="flex items-center gap-2 bg-white border rounded-xl p-2">
                  <input type="checkbox" checked={h.activo} onChange={(e) => {
                    const next = localHorarios.map((x) => x.dia === h.dia ? { ...x, activo: e.target.checked } : x);
                    setLocalHorarios(next);
                  }} />
                  <span className="w-20 text-sm font-medium">{DIAS[h.dia].slice(0, 3)}</span>
                  <Input type="time" value={h.abre} onChange={(e) => {
                    const next = localHorarios.map((x) => x.dia === h.dia ? { ...x, abre: e.target.value } : x);
                    setLocalHorarios(next);
                  }} className="h-8" />
                  <span className="text-xs">a</span>
                  <Input type="time" value={h.cierra} onChange={(e) => {
                    const next = localHorarios.map((x) => x.dia === h.dia ? { ...x, cierra: e.target.value } : x);
                    setLocalHorarios(next);
                  }} className="h-8" />
                </div>
              ))}
            </div>
            <Button onClick={() => { horario.updateHorarios(localHorarios); setMsg({ title: "Horarios guardados", desc: "Se actualizaron los horarios. El cartel de cerrado se mostrará según corresponda." }); }} className="w-full">Guardar horarios</Button>
          </CardContent>
        </Card>
      )}

      <AlertModal open={!!msg} onClose={() => setMsg(null)} title={msg?.title ?? ""} description={msg?.desc ?? ""} />
    </div>
  );
}
