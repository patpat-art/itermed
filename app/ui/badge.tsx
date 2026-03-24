"use client";

import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

type BadgeVariant = "default" | "info" | "success" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/80 text-zinc-700 border-zinc-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
  info: "bg-sky-50/80 text-sky-700 border-sky-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
  success: "bg-emerald-50/80 text-emerald-700 border-emerald-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
  warning: "bg-amber-50/80 text-amber-700 border-amber-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

