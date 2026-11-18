"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, USUARIOS_MOCK } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const { login, loginAs, pending2FA, verify2FAAndLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@gigipapas.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (res.ok) router.push("/pedidos");
    else if (res.need2FA) setError("");
    else setError(res.error ?? "Error al iniciar sesión");
  };

  const handleQuick = (rol: (typeof USUARIOS_MOCK)[number]["rol"]) => {
    const r = loginAs(rol);
    if (r.need2FA) return;
    router.push(rol === "cocina" ? "/cocina" : rol === "caja" ? "/caja" : "/pedidos");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = verify2FAAndLogin(code);
    if (ok) router.push("/pedidos");
    else setError("Código 2FA incorrecto o expirado");
  };

  if (pending2FA) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-20 h-20 mx-auto rounded-full border-4 border-white object-cover" />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#FF6B00]">Gigi Papas</h1>
            <p className="text-white/70 text-sm tracking-widest">COMIDAS RAPIDAS</p>
          </div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold tracking-tight text-lg">Verificación en dos pasos</h2>
              <p className="text-sm text-zinc-500">Admin ingresa el código de 6 dígitos</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <Label>Código 2FA</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} autoFocus />
                  <p className="text-xs text-zinc-400 mt-1">Abre tu app autenticadora (Google Authenticator / Authy) o ve a Mi cuenta para ver el código.</p>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
                <Button type="submit" className="w-full">Verificar y entrar</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => window.location.reload()}>Cancelar</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-20 h-20 mx-auto rounded-full border-4 border-white object-cover" />
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#FF6B00]">Gigi Papas</h1>
          <p className="text-white/70 text-sm tracking-widest">COMIDAS RAPIDAS</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-semibold tracking-tight text-lg">Iniciar sesion</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gigipapas.com" />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
              <Button type="submit" className="w-full">Entrar</Button>
            </form>

            <div className="mt-6">
              <div className="grid grid-cols-2 gap-2">
                {USUARIOS_MOCK.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleQuick(u.rol)}
                    className="text-left p-3 rounded-lg border hover:bg-zinc-50 transition"
                  >
                    <p className="text-sm font-bold capitalize">{u.rol}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-center text-zinc-400 mt-4">Gigi Papas Comidas Rapidas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
