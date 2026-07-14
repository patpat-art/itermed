"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/app/ui/input";
import { Badge } from "@/app/ui/badge";
import {
  ExamAccordionItem,
  type ExamMetadataClient,
} from "@/components/exams/ExamAccordionItem";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

type ExamsAdminPanelProps = {
  initialExams: ExamMetadataClient[];
  initialCategories: string[];
};

export function ExamsAdminPanel({ initialExams, initialCategories }: ExamsAdminPanelProps) {
  const [exams, setExams] = useState(initialExams);
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const debouncedQuery = useDebouncedValue(query, 200);

  const refreshList = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (categoryFilter) params.set("category", categoryFilter);
    const res = await fetch(`/api/exams?${params.toString()}`);
    if (!res.ok) return;
    const data = (await res.json()) as { exams: ExamMetadataClient[]; categories: string[] };
    setExams(data.exams);
    setCategories(data.categories);
  }, [debouncedQuery, categoryFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const matchIds = useMemo(() => new Set(exams.map((e) => e.id)), [exams]);

  const grouped = useMemo(() => {
    const map = new Map<string, ExamMetadataClient[]>();
    for (const exam of exams) {
      const list = map.get(exam.category) ?? [];
      list.push(exam);
      map.set(exam.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "it"));
  }, [exams]);

  const handleSave = useCallback(async (id: string, patch: Partial<ExamMetadataClient>) => {
    const res = await fetch(`/api/exams/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as ExamMetadataClient;
    setExams((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const handleCreate = async () => {
    const id = window.prompt("ID esame (es. nuovo-esame):");
    if (!id?.trim()) return;
    const name = window.prompt("Nome esame:") ?? id;
    const category = window.prompt("Categoria:", categoryFilter || "Laboratorio") ?? "Laboratorio";

    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id.trim().toLowerCase(),
        name,
        category,
        baseCost: 0,
        baseTurnaroundMinutes: 60,
      }),
    });
    if (!res.ok) return;
    await refreshList();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Cerca esami (es. "latt", "troponina", "TC")...'
            className="h-9 pl-8 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuovo esame
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setCategoryFilter("")}>
          <Badge variant={!categoryFilter ? "info" : "default"}>Tutte</Badge>
        </button>
        {categories.map((cat) => (
          <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}>
            <Badge variant={categoryFilter === cat ? "info" : "default"}>{cat}</Badge>
          </button>
        ))}
      </div>

      <div className="space-y-4 max-h-[680px] overflow-y-auto rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3">
        {grouped.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">Nessun esame trovato.</p>
        ) : (
          grouped.map(([category, items]) => (
            <section key={category} className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 px-1">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((exam) => (
                  <ExamAccordionItem
                    key={exam.id}
                    exam={exam}
                    forceOpen={debouncedQuery.trim().length > 0 && matchIds.has(exam.id)}
                    onSave={handleSave}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
