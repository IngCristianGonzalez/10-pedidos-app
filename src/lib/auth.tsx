"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Rol, Usuario } from "@/types";

const STORAGE_AUTH = "gigi_auth";
const STORAGE_PASSWORDS = "gigi_passwords";
const STORAGE_2FA = "gigi_2fa";

export const USUARIOS_MOCK: Usuario[] = [
  { id: "u1", nombre: "Admin Gigi", email: "admin@gigipapas.com", rol: "admin" },
  { id: "u2", nombre: "Mesero 1", email: "mesero@gigipapas.com", rol: "mesero" },
  { id: "u3", nombre: "Cocina", email: "cocina@gigipapas.com", rol: "cocina" },
  { id: "u4", nombre: "Caja", email: "caja@gigipapas.com", rol: "caja" },
];

const DEFAULT_PASSWORD = "123456";

type TwoFAStore = Record<string, { enabled: boolean; secret: string }>;

function getPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_PASSWORDS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function setPasswords(map: Record<string, string>) {
  localStorage.setItem(STORAGE_PASSWORDS, JSON.stringify(map));
}
function getPasswordFor(email: string): string {
  const map = getPasswords();
  return map[email.toLowerCase()] ?? DEFAULT_PASSWORD;
}

function get2FAStore(): TwoFAStore {
  try {
    const raw = localStorage.getItem(STORAGE_2FA);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function set2FAStore(store: TwoFAStore) {
  localStorage.setItem(STORAGE_2FA, JSON.stringify(store));
}

// TOTP mock: deterministic 6 dígitos basado en secret + ventana 30s
export function generateTOTP(secret: string, windowOffset = 0): string {
  const step = Math.floor(Date.now() / 30000) + windowOffset;
  const combined = `${secret}:${step}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
  }
  // mezcla extra
  hash = (hash ^ (hash >>> 16)) >>> 0;
  const code = hash % 1000000;
  return String(code).padStart(6, "0");
}
export function verifyTOTP(secret: string, code: string): boolean {
  const c = code.trim();
  return c === generateTOTP(secret, 0) || c === generateTOTP(secret, -1) || c === generateTOTP(secret, 1);
}
export function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let s = "";
  for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

type AuthContextType = {
  user: Usuario | null;
  pending2FA: Usuario | null;
  login: (email: string, password: string) => { ok: boolean; need2FA?: boolean; error?: string };
  loginAs: (rol: Rol) => { need2FA?: boolean };
  verify2FAAndLogin: (code: string) => boolean;
  logout: () => void;
  isAllowed: (roles: Rol[]) => boolean;
  changePassword: (oldPass: string, newPass: string) => { ok: boolean; error?: string };
  is2FAEnabled: (userId?: string) => boolean;
  get2FASecret: (userId?: string) => string | null;
  setup2FA: () => string;
  confirm2FA: (code: string) => boolean;
  disable2FA: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [pending2FA, setPending2FA] = useState<Usuario | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_AUTH);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const is2FAEnabled = (userId?: string) => {
    const uid = userId ?? user?.id;
    if (!uid) return false;
    const store = get2FAStore();
    return !!store[uid]?.enabled;
  };
  const get2FASecret = (userId?: string) => {
    const uid = userId ?? user?.id;
    if (!uid) return null;
    const store = get2FAStore();
    return store[uid]?.secret ?? null;
  };

  const login = (email: string, password: string) => {
    const found = USUARIOS_MOCK.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { ok: false, error: "Usuario no encontrado" };
    const expected = getPasswordFor(found.email);
    if (password !== expected) return { ok: false, error: "Contraseña incorrecta" };
    // 2FA solo para admin si está activado
    if (found.rol === "admin" && is2FAEnabled(found.id)) {
      setPending2FA(found);
      return { ok: false, need2FA: true };
    }
    setUser(found);
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(found));
    return { ok: true };
  };

  const loginAs = (rol: Rol) => {
    const found = USUARIOS_MOCK.find((u) => u.rol === rol);
    if (!found) return {};
    if (found.rol === "admin" && is2FAEnabled(found.id)) {
      setPending2FA(found);
      return { need2FA: true };
    }
    setUser(found);
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(found));
    return {};
  };

  const verify2FAAndLogin = (code: string) => {
    if (!pending2FA) return false;
    const store = get2FAStore();
    const cfg = store[pending2FA.id];
    if (!cfg?.secret) return false;
    if (!verifyTOTP(cfg.secret, code)) return false;
    setUser(pending2FA);
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(pending2FA));
    setPending2FA(null);
    return true;
  };

  const logout = () => {
    setUser(null);
    setPending2FA(null);
    localStorage.removeItem(STORAGE_AUTH);
  };

  const isAllowed = (roles: Rol[]) => {
    if (!user) return false;
    if (user.rol === "admin") return true;
    return roles.includes(user.rol);
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (!user) return { ok: false, error: "No autenticado" };
    if (newPass.length < 4) return { ok: false, error: "La contraseña debe tener al menos 4 caracteres" };
    const expected = getPasswordFor(user.email);
    if (oldPass !== expected) return { ok: false, error: "Contraseña actual incorrecta" };
    const map = getPasswords();
    map[user.email.toLowerCase()] = newPass;
    setPasswords(map);
    return { ok: true };
  };

  const setup2FA = () => {
    if (!user || user.rol !== "admin") return "";
    const secret = generateSecret();
    const store = get2FAStore();
    store[user.id] = { enabled: false, secret };
    set2FAStore(store);
    return secret;
  };

  const confirm2FA = (code: string) => {
    if (!user || user.rol !== "admin") return false;
    const store = get2FAStore();
    const cfg = store[user.id];
    if (!cfg?.secret) return false;
    if (!verifyTOTP(cfg.secret, code)) return false;
    store[user.id] = { enabled: true, secret: cfg.secret };
    set2FAStore(store);
    return true;
  };

  const disable2FA = () => {
    if (!user) return;
    const store = get2FAStore();
    if (store[user.id]) {
      store[user.id].enabled = false;
      set2FAStore(store);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, pending2FA, login, loginAs, verify2FAAndLogin, logout, isAllowed, changePassword, is2FAEnabled, get2FASecret, setup2FA, confirm2FA, disable2FA }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
