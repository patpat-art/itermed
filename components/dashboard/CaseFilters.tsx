"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CaseDifficulty } from "@prisma/client";
import { Badge } from "@/app/ui/badge";
import { DIFFICULTY_LABELS } from "@/lib/dashboard-queries";
import { Filter } from "lucide-react";

type MedicalSpecialtyOption = {
  id: string;
  name: string;
};

type CaseFiltersProps = {
  specialties: MedicalSpecialtyOption[];
  resultCount?: number;
};

const DIFFICULTY_OPTIONS: CaseDifficulty[] = ["EASY", "MEDIUM", "HARD"];

export function CaseFilters({ specialties, resultCount }: CaseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSpecialtyId = searchParams.get("specialtyId") ?? "";
  const activeDifficulty = searchParams.get("difficulty") ?? "";

  const setFilter = useCallback(
    (key: "specialtyId" | "difficulty", value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(key) ?? "";
      if (!value || current === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = Boolean(activeSpecialtyId || activeDifficulty);

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-5 py-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtra i casi clinici</span>
        </div>
        {typeof resultCount === "number" ? (
          <span className="text-[11px] text-zinc-500">
            {resultCount} {resultCount === 1 ? "risultato" : "risultati"}
          </span>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-full sm:w-auto">
            Specialità
          </span>
          <button type="button" onClick={() => setFilter("specialtyId", "")} className="focus:outline-none">
            <Badge
              variant={!activeSpecialtyId ? "info" : "default"}
              className={!activeSpecialtyId ? "ring-2 ring-sky-200" : ""}
            >
              Tutte
            </Badge>
          </button>
          {specialties.map((specialty) => (
            <button
              key={specialty.id}
              type="button"
              onClick={() => setFilter("specialtyId", specialty.id)}
              className="focus:outline-none"
            >
              <Badge
                variant={activeSpecialtyId === specialty.id ? "info" : "default"}
                className={activeSpecialtyId === specialty.id ? "ring-2 ring-sky-200" : ""}
              >
                {specialty.name}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 w-full sm:w-auto">
            Difficoltà
          </span>
          <button type="button" onClick={() => setFilter("difficulty", "")} className="focus:outline-none">
            <Badge
              variant={!activeDifficulty ? "info" : "default"}
              className={!activeDifficulty ? "ring-2 ring-sky-200" : ""}
            >
              Tutte
            </Badge>
          </button>
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setFilter("difficulty", difficulty)}
              className="focus:outline-none"
            >
              <Badge
                variant={activeDifficulty === difficulty ? "info" : "default"}
                className={activeDifficulty === difficulty ? "ring-2 ring-sky-200" : ""}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </Badge>
            </button>
          ))}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 ml-1"
            >
              Azzera filtri
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
