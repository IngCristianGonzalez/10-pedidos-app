"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, USUARIOS_MOCK } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const { login, loginAs } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@gigipapas.com");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(email, "123");
    if (ok) router.push("/pedidos");
    else setError("Usuario no encontrado. Usa uno de los botones rápidos.");
  };

  const handleQuick = (rol: (typeof USUARIOS_MOCK)[number]["rol"]) => {
    loginAs(rol);
    router.push(rol === "cocina" ? "/cocina" : rol === "caja" ? "/caja" : "/pedidos");
  };

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
            <p className="text-sm text-zinc-500">Acceso por rol</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gigipapas.com" />
              </div>
              <div>
                <Label>Contrasena</Label>
                <Input type="password" defaultValue="123456" placeholder="••••••" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
              <Button type="submit" className="w-full">Entrar</Button>
            </form>

            <div className="mt-6">
              <p className="text-xs font-medium text-zinc-600 mb-2">Acceso por rol:</p>
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
            <p className="text-xs text-center text-zinc-400 mt-4">Gigi Papas — Comidas Rapidas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
