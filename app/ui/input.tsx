"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-2xl border border-zinc-200/80 bg-white/80 px-3 text-sm text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)] outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-blue-500/10",
        className,
      )}
      {...props}
    />
  );
}

