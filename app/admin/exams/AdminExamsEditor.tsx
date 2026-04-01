"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../ui/input";

type ExamMeta = {
  price: number;
  urgencyTiming: string;
  routineTiming: string;
  routineMinutes: number;
  normalFinding: string;
};

type Props = {
  initialValues: Record<string, ExamMeta>;
  saveAction: (formData: FormData) => void;
};

export function AdminExamsEditor({ initialValues, saveAction }: Props) {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, ExamMeta>>(initialValues);
  const [openId, setOpenId] = useState<string | null>(Object.keys(initialValues)[0] ?? null);

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return Object.keys(values);
    return Object.keys(values).filter((id) => {
      const v = values[id];
      return (
        id.toLowerCase().includes(q) ||
        v.normalFinding.toLowerCase().includes(q) ||
        v.urgencyTiming.toLowerCase().includes(q) ||
        v.routineTiming.toLowerCase().includes(q)
      );
    });
  }, [query, values]);

  const update = (id: string, field: keyof ExamMeta, raw: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]:
          field === "price" || field === "routineMinutes"
            ? Number(raw || 0)
            : raw,
      },
    }));
  };

  return (
    <form action={saveAction} className="space-y-3">
      <input type="hidden" name="payload" value={JSON.stringify(values)} />
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca esami (id, tempo, valore standard...)"
          className="h-9 pl-8 text-xs"
        />
      </div>

      <div className="space-y-2 max-h-[620px] overflow-y-auto rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-2">
        {filteredIds.length === 0 ? (
          <p className="px-2 py-1 text-xs text-zinc-500">Nessun esame trovato.</p>
        ) : (
          filteredIds.map((id) => {
            const open = openId === id;
            const exam = values[id];
            return (
              <div key={id} className="rounded-xl border border-zinc-200/80 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-800"
                >
                  <span>{id}</span>
                  <span className="text-zinc-500">{open ? "−" : "+"}</span>
                </button>
                {open ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-3 pb-3">
                    <Input
                      value={String(exam.price)}
                      onChange={(e) => update(id, "price", e.target.value)}
                      placeholder="Prezzo"
                      className="h-8 text-[11px]"
                    />
                    <Input
                      value={exam.urgencyTiming}
                      onChange={(e) => update(id, "urgencyTiming", e.target.value)}
                      placeholder="Tempo d'Urgenza"
                      className="h-8 text-[11px]"
                    />
                    <Input
                      value={exam.routineTiming}
                      onChange={(e) => update(id, "routineTiming", e.target.value)}
                      placeholder="Tempo Richiesto"
                      className="h-8 text-[11px]"
                    />
                    <Input
                      value={String(exam.routineMinutes)}
                      onChange={(e) => update(id, "routineMinutes", e.target.value)}
                      placeholder="Minuti routine"
                      className="h-8 text-[11px]"
                    />
                    <div className="md:col-span-2">
                      <Input
                        value={exam.normalFinding}
                        onChange={(e) => update(id, "normalFinding", e.target.value)}
                        placeholder="Valori standard"
                        className="h-8 text-[11px]"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-full bg-zinc-950 px-4 text-xs font-medium text-zinc-50"
        >
          Salva valori esami
        </button>
      </div>
    </form>
  );
}

