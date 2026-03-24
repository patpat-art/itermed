"use client";

import type { ReactNode } from "react";
import { cn } from "../utils/cn";

type TabsContextProps = {
  value: string;
  onValueChange: (value: string) => void;
};

type TabsRootProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export function Tabs({ value, onValueChange, children, className }: TabsRootProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} data-tabs-value={value}>
      {children}
    </div>
  );
}

type TabsListProps = {
  children: ReactNode;
  className?: string;
  value?: string;
};

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/80 p-1 border border-zinc-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  currentValue: string;
  onSelect: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export function TabsTrigger({
  value,
  currentValue,
  onSelect,
  children,
  className,
}: TabsTriggerProps) {
  const isActive = value === currentValue;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors",
        isActive
          ? "bg-zinc-950 text-zinc-50 shadow-sm"
          : "bg-transparent text-zinc-600 hover:text-zinc-950",
        className,
      )}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  currentValue: string;
  children: ReactNode;
  className?: string;
};

export function TabsContent({
  value,
  currentValue,
  children,
  className,
}: TabsContentProps) {
  if (value !== currentValue) return null;
  return (
    <div className={className}>
      {children}
    </div>
  );
}

