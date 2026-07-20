import Link from "next/link";
import { Database } from "lucide-react";
import { Badge } from "@/app/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { fetchGuidelineDocuments } from "@/lib/guidelines/queries";

function excerpt(text: string, max = 280): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export default async function DashboardGuidelinesPage() {
  const docs = await fetchGuidelineDocuments({ includeText: true });
  const activeCount = docs.filter((doc) => doc.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#2F4156]">
            <Database className="h-5 w-5" />
            <h1 className="text-xl font-semibold tracking-tight text-[#2F4156]">Linee Guida</h1>
          </div>
          <p className="text-sm text-slate-500">
            Archivio documenti medico-legali e protocolli clinici utilizzati dal motore RAG nelle
            simulazioni.
          </p>
        </div>
        <Link
          href="/admin/knowledge/new"
          className="rounded-lg bg-[#1E324E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2A486D]"
        >
          Carica documento
        </Link>
      </header>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Documenti caricati</CardTitle>
          <CardDescription>
            {docs.length} totali · {activeCount} attive nel motore RAG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {docs.length === 0 ? (
            <p className="text-zinc-500">Nessuna linea guida caricata.</p>
          ) : (
            docs.map((doc) => (
              <article
                key={doc.id}
                className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-medium text-zinc-900">{doc.title}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {doc.sourceType}
                      {doc.sourceName ? ` · ${doc.sourceName}` : ""}
                      {" · "}
                      {doc.chunkCount} chunk
                      {" · "}
                      Caricata il{" "}
                      {doc.createdAt.toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={doc.isActive ? "success" : "default"}>
                    {doc.isActive ? "Attiva" : "Disabilitata"}
                  </Badge>
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

                {"text" in doc && doc.text ? (
                  <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">
                    {excerpt(doc.text, 420)}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-500">
        Gestione completa (attiva/disattiva, elimina):{" "}
        <Link href="/admin/knowledge" className="underline hover:text-zinc-800">
          Pannello Guidelines Admin
        </Link>
        .
      </p>
    </div>
  );
}
