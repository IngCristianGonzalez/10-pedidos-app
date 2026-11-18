"use client";
import React from "react";
import { Button } from "./button";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-[20px] bg-white shadow-2xl border border-black/10 overflow-hidden animate-in">
        {/* header brand */}
        <div className="bg-[#0A0A0A] px-5 py-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-9 h-9 rounded-xl object-cover border border-white/20" />
          <div>
            <p className="text-white font-black tracking-tight leading-none">Gigi Papas</p>
            <p className="text-white/60 text-[11px] tracking-widest uppercase">Comidas Rápidas</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/60 hover:text-white text-xl leading-none px-2">×</button>
        </div>
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-black text-lg tracking-tight text-[#0A0A0A]">{title}</h3>
          {description && <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{description}</p>}
          {children && <div className="mt-3">{children}</div>}
        </div>
        {footer && <div className="px-5 pb-5 pt-3 flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1 md:flex-none">
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 md:flex-none ${variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#FF6B00] hover:bg-[#E55F00]"}`}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

export function AlertModal({
  open,
  onClose,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <Button variant="primary" onClick={onClose} className="w-full md:w-auto bg-[#FF6B00] hover:bg-[#E55F00]">
          Entendido
        </Button>
      }
    />
  );
}
