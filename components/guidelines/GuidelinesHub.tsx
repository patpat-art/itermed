"use client";

import { useMemo, useState } from "react";
import { BookOpen, FileUp, Search, ShieldAlert, Trash2 } from "lucide-react";
import { Badge } from "@/app/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { Input } from "@/app/ui/input";
import { cn } from "@/app/utils/cn";
import { GuidelineIngestPanel } from "@/components/guidelines/GuidelineIngestPanel";
import {
  deleteGuidelineDocument,
  toggleGuidelineDocument,
} from "@/app/dashboard/guidelines/actions";

export type GuidelinesHubDoc = {
  id: string;
  title: string;
  tags: string[];
  sourceType: string;
  sourceName: string | null;
  chunkCount: number;
  isActive: boolean;
  createdAt: string;
  text?: string;
};

type GuidelinesHubProps = {
  docs: GuidelinesHubDoc[];
  isAdmin: boolean;
  loadError: string | null;
  initialTab?: "browse" | "ingest";
};

function excerpt(text: string, max = 280): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export function GuidelinesHub({
  docs,
  isAdmin,
  loadError,
  initialTab = "browse",
}: GuidelinesHubProps) {
  const [tab, setTab] = useState<"browse" | "ingest">(
    isAdmin && initialTab === "ingest" ? "ingest" : "browse",
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) => {
      const haystack = [doc.title, doc.sourceName ?? "", doc.tags.join(" "), doc.text ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [docs, query]);

  const activeCount = docs.filter((d) => d.isActive).length;

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Linee Guida
          </h1>
          <p className="max-w-2xl text-base text-slate-500">
            Documenti e protocolli clinici per la simulazione.
            {isAdmin ? " Come admin puoi caricare e gestire i documenti." : ""}
          </p>
        </div>
        {isAdmin ? (
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTab("browse")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                tab === "browse"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-primary",
              )}
            >
              Archivio
            </button>
            <button
              type="button"
              onClick={() => setTab("ingest")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                tab === "ingest"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-primary",
              )}
            >
              <FileUp className="h-3.5 w-3.5" />
              Carica / Indicizza
            </button>
          </div>
        ) : null}
      </header>

      {tab === "ingest" && isAdmin ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-brand-primary">
              Carica documento RAG
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              PDF o testo → chunking → embeddings Pinecone / Postgres.
            </p>
          </div>
          <GuidelineIngestPanel />
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca per titolo, tag o contenuto…"
                className="h-10 rounded-full bg-slate-50 pl-9 text-sm shadow-none"
              />
            </div>
            <p className="text-xs text-slate-500">
              {loadError
                ? "Archivio non disponibile"
                : `${docs.length} documenti · ${activeCount} attivi`}
            </p>
          </div>

          <Card className="rounded-xl border-border bg-panel-bg shadow-aequan-panel">
            <CardHeader>
              <CardTitle className="font-display text-sm font-semibold text-brand-primary">
                Documenti
              </CardTitle>
              <CardDescription className="text-xs">
                {query.trim()
                  ? `${filtered.length} risultati per “${query.trim()}”`
                  : "Linee guida e riferimenti disponibili per simulazioni e valutazioni."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loadError ? (
                <div className="flex flex-col items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-5">
                  <div className="flex items-center gap-2 text-rose-800">
                    <ShieldAlert className="h-4 w-4" />
                    <p className="text-sm font-medium">{loadError}</p>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setTab("ingest")}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white hover:bg-brand-primary-hover"
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Carica documento
                    </button>
                  ) : null}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-ui-bg/80 px-4 py-6">
                  <p className="text-sm font-medium text-slate-800">
                    {docs.length === 0 ? "Nessuna linea guida caricata" : "Nessun risultato"}
                  </p>
                  <p className="max-w-md text-xs leading-relaxed text-slate-500">
                    {docs.length === 0
                      ? "L'archivio è vuoto. Un amministratore può caricare PDF o testo da questa pagina."
                      : "Prova a modificare i termini di ricerca."}
                  </p>
                  {isAdmin && docs.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setTab("ingest")}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white hover:bg-brand-primary-hover"
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Carica documento RAG
                    </button>
                  ) : null}
                </div>
              ) : (
                filtered.map((doc) => (
                  <article
                    key={doc.id}
                    className="space-y-2 rounded-xl border border-border bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-slate-900">{doc.title}</h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {doc.sourceType}
                          {doc.sourceName ? ` · ${doc.sourceName}` : ""}
                          {" · "}
                          {doc.chunkCount} chunk
                          {" · "}
                          Caricata il{" "}
                          {new Date(doc.createdAt).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.isActive ? "success" : "default"}>
                          {doc.isActive ? "Attiva" : "Disabilitata"}
                        </Badge>
                        {isAdmin ? (
                          <>
                            <form action={toggleGuidelineDocument}>
                              <input type="hidden" name="id" value={doc.id} />
                              <button
                                type="submit"
                                className={cn(
                                  "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
                                  doc.isActive
                                    ? "border-brand-secondary bg-brand-secondary"
                                    : "border-slate-200 bg-slate-100",
                                )}
                                aria-pressed={doc.isActive}
                                title={doc.isActive ? "Disabilita" : "Abilita"}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                                    doc.isActive ? "translate-x-5" : "translate-x-1",
                                  )}
                                />
                              </button>
                            </form>
                            <form action={deleteGuidelineDocument}>
                              <input type="hidden" name="id" value={doc.id} />
                              <button
                                type="submit"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                title="Elimina documento"
                                aria-label="Elimina documento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {doc.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="info" className="text-[11px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {doc.text ? (
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                        {excerpt(doc.text, 420)}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
