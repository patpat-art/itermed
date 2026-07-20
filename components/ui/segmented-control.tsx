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
        "inline-flex w-full rounded-clinical border border-zinc-200/60 bg-clinical-bg p-0.5",
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
              "flex-1 rounded-clinical px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              active
                ? "border border-zinc-200/80 bg-white text-clinical-navy shadow-clinical"
                : "border border-transparent text-slate-600 hover:text-clinical-navy",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
