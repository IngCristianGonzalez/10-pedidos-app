import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "outline"; size?: "sm" | "md" | "lg" }) {
  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-[#FF6B00] text-white hover:bg-[#E55F00] shadow",
    secondary: "bg-black text-white hover:bg-zinc-800",
    ghost: "bg-transparent hover:bg-zinc-100 text-zinc-800",
    outline: "border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
