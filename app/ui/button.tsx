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
    "bg-zinc-950 text-zinc-50 hover:bg-zinc-900 disabled:hover:bg-zinc-950 shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.14)]",
  secondary:
    "bg-white/80 text-zinc-950 hover:bg-white border border-zinc-200/80 shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)] disabled:hover:bg-white/80",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
  outline:
    "bg-white/80 text-zinc-950 border border-zinc-200/80 hover:bg-zinc-50",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-medium border border-transparent transition-all disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-blue-500/12 focus-visible:border-zinc-400",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

