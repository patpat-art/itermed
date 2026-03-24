"use client";

import * as React from "react";
import { cn } from "../utils/cn";

type AccordionContextValue = {
  openItem: string | null;
  setOpenItem: (value: string | null) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export type AccordionProps = {
  children: React.ReactNode;
  className?: string;
};

export function Accordion({ children, className }: AccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(null);

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div
      data-accordion-item={value}
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

type AccordionTriggerProps = {
  value: string;
  children: React.ReactNode;
};

export function AccordionTrigger({ value, children }: AccordionTriggerProps) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) return null;
  const isOpen = ctx.openItem === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setOpenItem(isOpen ? null : value)}
      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 rounded-2xl"
    >
      <span>{children}</span>
      <span className="text-[10px] text-zinc-400">{isOpen ? "–" : "+"}</span>
    </button>
  );
}

type AccordionContentProps = {
  value: string;
  children: React.ReactNode;
};

export function AccordionContent({ value, children }: AccordionContentProps) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) return null;
  const isOpen = ctx.openItem === value;

  if (!isOpen) return null;

  return <div className="px-3 pb-3 pt-1 text-xs text-zinc-700">{children}</div>;
}

