"use client";

import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

type BadgeVariant = "default" | "info" | "success" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-white text-slate-600 border-slate-200 shadow-sm",
  info: "bg-slate-50 text-[#345884] border-slate-200 shadow-sm",
  success: "bg-slate-50 text-[#1E324E] border-slate-200 shadow-sm",
  warning: "bg-amber-50/80 text-amber-800 border-amber-200/80 shadow-sm",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
