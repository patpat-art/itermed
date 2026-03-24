"use client";

import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type DialogProps = {
  open: boolean;
  children: ReactNode;
};

export function Dialog({ open, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/25 backdrop-blur-sm">
      {children}
    </div>
  );
}

type DialogContentProps = {
  children: ReactNode;
  className?: string;
};

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div
      className={cn(
        "w-full max-w-3xl rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn("mb-4 space-y-1.5", className)}>
      {children}
    </div>
  );
}

type DialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn("text-base font-semibold tracking-tight", className)}>
      {children}
    </h2>
  );
}

type DialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn("text-xs text-zinc-600 leading-relaxed", className)}>
      {children}
    </p>
  );
}

type DialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn("mt-6 flex items-center justify-end gap-3", className)}>
      {children}
    </div>
  );
}

