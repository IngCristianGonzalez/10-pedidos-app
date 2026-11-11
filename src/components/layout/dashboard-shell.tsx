"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Rol } from "@/types";
import { useState } from "react";

const NAV: { href: string; label: string; roles: Rol[] }[] = [
  { href: "/pedidos", label: "Pedidos", roles: ["admin", "mesero"] },
  { href: "/cocina", label: "Cocina", roles: ["admin", "cocina"] },
  { href: "/caja", label: "Caja", roles: ["admin", "caja"] },
  { href: "/productos", label: "Productos", roles: ["admin"] },
  { href: "/reportes", label: "Reportes", roles: ["admin", "caja"] },
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
    <div className="min-h-screen bg-[#fbfbfd] flex">
      {/* Sidebar desktop - Apple material dark */}
      <aside className="hidden md:flex w-64 flex-col material-dark text-white border-r border-white/10">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center font-semibold text-lg tracking-tight">G</div>
          <div>
            <p className="font-semibold leading-none tracking-tight text-white">Gigi Papas</p>
            <p className="text-[11px] tracking-wide text-white/60 uppercase">Comidas Rapidas</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {filtered.map((n) => {
            const active = pathname === n.href || pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition duration-100 active:scale-[0.98] ${active ? "bg-[#FF6B00] text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-sm font-medium tracking-tight">{user.nombre}</p>
          <p className="text-xs text-white/50 capitalize tracking-wide">{user.rol} • {user.email}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full bg-white/10 text-white hover:bg-white/15 border border-white/10" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </aside>

      {/* Mobile + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden material-dark text-white p-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(!open)} className="p-2 rounded-xl bg-white/10 active:scale-95 transition">Menu</button>
            <span className="font-semibold tracking-tight text-white">Gigi Papas</span>
          </div>
          <span className="text-xs bg-[#FF6B00] px-2 py-1 rounded-full capitalize tracking-wide">{user.rol}</span>
        </header>
        {open && (
          <div className="md:hidden material-dark text-white p-3 space-y-1 border-t border-white/10">
            {filtered.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                {n.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl bg-white/10 mt-2 text-sm">Cerrar sesion — {user.nombre}</button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
        <footer className="p-4 text-center text-xs tracking-wide text-zinc-500 border-t bg-white/70 backdrop-blur">
          Gigi Papas — Cliente Duvan Basanta — MVP local — efectivo y transferencia
        </footer>
      </div>
    </div>
  );
}
