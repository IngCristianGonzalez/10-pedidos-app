"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Rol, Usuario } from "@/types";

const STORAGE_AUTH = "gigi_auth";

export const USUARIOS_MOCK: Usuario[] = [
  { id: "u1", nombre: "Admin Gigi", email: "admin@gigipapas.com", rol: "admin" },
  { id: "u2", nombre: "Mesero 1", email: "mesero@gigipapas.com", rol: "mesero" },
  { id: "u3", nombre: "Cocina", email: "cocina@gigipapas.com", rol: "cocina" },
  { id: "u4", nombre: "Caja", email: "caja@gigipapas.com", rol: "caja" },
];

type AuthContextType = {
  user: Usuario | null;
  login: (email: string, password: string) => boolean;
  loginAs: (rol: Rol) => void;
  logout: () => void;
  isAllowed: (roles: Rol[]) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_AUTH);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (email: string) => {
    const found = USUARIOS_MOCK.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_AUTH, JSON.stringify(found));
      return true;
    }
    return false;
  };

  const loginAs = (rol: Rol) => {
    const found = USUARIOS_MOCK.find((u) => u.rol === rol);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_AUTH, JSON.stringify(found));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_AUTH);
  };

  const isAllowed = (roles: Rol[]) => {
    if (!user) return false;
    if (user.rol === "admin") return true;
    return roles.includes(user.rol);
  };

  return <AuthContext.Provider value={{ user, login, loginAs, logout, isAllowed }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
