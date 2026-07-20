"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#1E324E] to-[#345884] text-white hover:opacity-95 disabled:hover:opacity-60 shadow-sm transition-all duration-300",
  secondary:
    "bg-white text-[#2F4156] hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors disabled:hover:bg-white",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-[#2F4156] transition-colors",
  outline:
    "bg-white text-[#2F4156] border border-slate-200 hover:bg-slate-50 transition-colors",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
  icon: "h-8 w-8 p-0",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium border border-transparent disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-[#345884]/20 focus-visible:border-[#345884]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
