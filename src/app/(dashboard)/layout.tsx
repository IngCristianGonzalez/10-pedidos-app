"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      // check localStorage async inside provider; wait a tick
      const t = setTimeout(() => {
        const raw = localStorage.getItem("gigi_auth");
        if (!raw) router.replace("/login");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-zinc-50">Verificando acceso...</div>;

  return <DashboardShell>{children}</DashboardShell>;
}
