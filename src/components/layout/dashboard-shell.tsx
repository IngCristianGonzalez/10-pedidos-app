"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Rol } from "@/types";
import { useState } from "react";

const NAV: { href: string; label: string; roles: Rol[]; icon: string }[] = [
  { href: "/pedidos", label: "Pedidos", roles: ["admin", "mesero"], icon: "🧾" },
  { href: "/cocina", label: "Cocina", roles: ["admin", "cocina"], icon: "🍳" },
  { href: "/caja", label: "Caja", roles: ["admin", "caja"], icon: "💰" },
  { href: "/productos", label: "Productos", roles: ["admin"], icon: "🍟" },
  { href: "/reportes", label: "Reportes", roles: ["admin", "caja"], icon: "📊" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return <div className="p-8 text-center">Cargando...</div>;

  const filtered = NAV.filter((n) => n.roles.includes(user.rol) || user.rol === "admin");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-black text-white border-r border-zinc-800">
        <div className="p-5 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center font-black text-lg">G</div>
          <div>
            <p className="font-black leading-none text-[#FF6B00]">Gigi Papas</p>
            <p className="text-xs text-zinc-400">Comidas Rápidas</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {filtered.map((n) => {
            const active = pathname === n.href || pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-[#FF6B00] text-white" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"}`}
              >
                <span>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <p className="text-sm font-semibold">{user.nombre}</p>
          <p className="text-xs text-zinc-400 capitalize">{user.rol} • {user.email}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full bg-zinc-900 text-white hover:bg-zinc-800" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-black text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(!open)} className="p-2 rounded-lg bg-zinc-900">☰</button>
            <span className="font-black text-[#FF6B00]">Gigi Papas</span>
          </div>
          <span className="text-xs bg-[#FF6B00] px-2 py-1 rounded-full capitalize">{user.rol}</span>
        </header>
        {open && (
          <div className="md:hidden bg-black text-white p-3 space-y-1 border-t border-zinc-800">
            {filtered.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900">
                <span>{n.icon}</span> {n.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg bg-zinc-800 mt-2">Cerrar sesión — {user.nombre}</button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
        <footer className="p-4 text-center text-xs text-zinc-500 border-t bg-white">
          Gigi Papas • Cliente Duvan Basanta • MVP $600K • Local • efectivo + transferencia
        </footer>
      </div>
    </div>
  );
}
