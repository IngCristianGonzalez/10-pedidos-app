import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "outline"; size?: "sm" | "md" | "lg" }) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none transition-[transform,background,opacity] duration-100 active:scale-[0.97] will-change-transform";
  const variants: Record<string, string> = {
    primary: "bg-[#FF6B00] text-white hover:bg-[#E55F00] shadow-sm",
    secondary: "bg-[#1d1d1f] text-white hover:bg-black",
    ghost: "bg-transparent hover:bg-zinc-100 text-[#1d1d1f]",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-50 text-[#1d1d1f]",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-[13px] leading-5",
    md: "px-4 py-2 text-sm leading-5",
    lg: "px-6 py-3 text-[15px] leading-6",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
