import { cn } from "@/app/utils/cn";

type AiTransparencyBadgeProps = {
  variant?: "workspace" | "report";
  className?: string;
};

/**
 * EU AI Act Art. 50 — interaction transparency notice for generative AI surfaces.
 */
export function AiTransparencyBadge({
  variant = "workspace",
  className,
}: AiTransparencyBadgeProps) {
  if (variant === "report") {
    return (
      <p
        role="note"
        className={cn(
          "rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600",
          className,
        )}
      >
        Report generato ed elaborato tramite Intelligenza Artificiale ad uso puramente formativo.
      </p>
    );
  }

  return (
    <p
      role="note"
      aria-label="Avviso di trasparenza AI — Regolamento UE 2024/1689 Articolo 50"
      className={cn(
        "inline-flex max-w-full items-center rounded-lg border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-[10px] font-medium leading-snug text-slate-600",
        className,
      )}
    >
      <span className="truncate">
        🤖 Sistema di IA Generativa — Simulazione Didattica (EU AI Act Compliant)
      </span>
    </p>
  );
}
