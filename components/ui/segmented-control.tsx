"use client";

import { cn } from "@/app/utils/cn";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Widget fisico piatto per selezione privacy / opzioni discrete. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full rounded-full border border-slate-200 bg-slate-50 p-1",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              active
                ? "bg-[#1E324E] text-white shadow-sm"
                : "text-slate-600 hover:text-[#1E324E]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
