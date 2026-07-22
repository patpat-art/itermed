"use client";

import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

type BadgeVariant = "default" | "info" | "success" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 border-transparent",
  info: "bg-[#EAF1FB] text-[#1E324E] border-transparent",
  success: "bg-emerald-50 text-emerald-700 border-transparent",
  warning: "bg-amber-50 text-amber-800 border-transparent",
  danger: "bg-rose-50 text-rose-700 border-transparent",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
