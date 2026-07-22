"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type CaseDifficulty,
  DIFFICULTY_LABELS,
} from "@/lib/dashboard-case-utils";
import { Search } from "lucide-react";

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
  const pathname = usePathname() ?? "/dashboard/prassi";
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeSpecialtyId = searchParams?.get("specialtyId") ?? "";
  const activeDifficulty = searchParams?.get("difficulty") ?? "";
  const activeQuery = searchParams?.get("q") ?? "";
  const safeSpecialties = Array.isArray(specialties)
    ? specialties.filter((s) => s?.id && s?.name)
    : [];

  const [searchValue, setSearchValue] = useState(activeQuery);

  useEffect(() => {
    setSearchValue(activeQuery);
  }, [activeQuery]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      mutate(params);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const trimmed = searchValue.trim();
    if (trimmed === activeQuery) return;
    const handle = window.setTimeout(() => {
      replaceParams((params) => {
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchValue, activeQuery, replaceParams]);

  const selectClassName =
    "h-9 max-w-[11rem] truncate rounded-full border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#1E324E]/30 focus:bg-white focus:ring-2 focus:ring-[#1E324E]/10";

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white px-4 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative w-64 shrink-0 sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cerca caso…"
            aria-label="Cerca caso clinico"
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#1E324E]/30 focus:bg-white focus:ring-2 focus:ring-[#1E324E]/10"
          />
        </div>

        <label className="flex shrink-0 items-center gap-2">
          <span className="sr-only">Specialità</span>
          <select
            value={activeSpecialtyId}
            onChange={(e) => {
              const value = e.target.value;
              replaceParams((params) => {
                params.delete("specialty");
                if (value) params.set("specialtyId", value);
                else params.delete("specialtyId");
              });
            }}
            aria-label="Filtra per specialità"
            className={selectClassName}
          >
            <option value="">Tutte le specialità</option>
            {safeSpecialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex shrink-0 items-center gap-2">
          <span className="sr-only">Difficoltà</span>
          <select
            value={activeDifficulty}
            onChange={(e) => {
              const value = e.target.value;
              replaceParams((params) => {
                if (value) params.set("difficulty", value);
                else params.delete("difficulty");
              });
            }}
            aria-label="Filtra per difficoltà"
            className={selectClassName}
          >
            <option value="">Tutte</option>
            {DIFFICULTY_OPTIONS.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {DIFFICULTY_LABELS[difficulty]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {typeof resultCount === "number" ? (
        <span className="shrink-0 text-xs tabular-nums text-slate-500">
          {resultCount} {resultCount === 1 ? "risultato" : "risultati"}
        </span>
      ) : null}
    </div>
  );
}
