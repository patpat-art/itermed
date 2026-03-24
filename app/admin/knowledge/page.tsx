"use client";

import { useState, type FormEvent } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";

export default function KnowledgeAdminPage() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const [rawTextTitle, setRawTextTitle] = useState("");
  const [rawTextTags, setRawTextTags] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ type: "error", text: "Seleziona un file PDF da caricare." });
      return;
    }

    if (!title.trim()) {
      setMessage({ type: "error", text: "Inserisci un titolo per il documento." });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("tags", tags);
      formData.append("file", file);

      const res = await fetch("/api/admin/ingest-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errMsg =
          (data && (data.error as string | undefined)) ||
          "Errore durante l'analisi del PDF.";
        throw new Error(errMsg);
      }

      const data = await res.json();
      setMessage({
        type: "success",
        text: `Documento indicizzato con successo (${data.chunks ?? "n"} chunk).`,
      });
      setTitle("");
      setTags("");
      setFile(null);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.message ?? "Impossibile caricare e analizzare il PDF.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="shrink-0 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Knowledge Base · Admin
        </h1>
        <p className="text-sm text-zinc-600 max-w-xl">
          Carica PDF di linee guida e manualistica medico-legale. Il testo verrà spezzato in
          chunk, indicizzato in Pinecone e usato dal motore di valutazione RAG.
        </p>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white/80 border-zinc-200/80 h-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">
              Carica documento PDF
            </CardTitle>
            <CardDescription>
              Per motivi di compatibilità runtime, l&apos;upload PDF diretto è temporaneamente
              disabilitato. Usa il pannello &quot;Incolla testo linee guida&quot; a destra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-xl">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Titolo del documento
                </label>
                <Input
                  type="text"
                  placeholder="Es. Linee Guida ESC 2024 Su STEMI"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Tags (separati da virgola)
                </label>
                <Input
                  type="text"
                  placeholder="Es. cardiologia, gelli-bianco, emergenza"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700">
                  File PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled
                  className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-200 file:px-4 file:py-1.5 file:text-xs file:font-medium file:text-zinc-500"
                />
                <p className="text-[11px] text-zinc-500">
                  Parsing PDF non ancora supportato in questo ambiente. Estrai il testo in locale
                  e usa il pannello a destra per indicizzarlo.
                </p>
              </div>

              <Button
                type="submit"
                size="md"
                disabled
                className="px-4"
              >
                <Upload className="h-4 w-4" />
                <span>Carica e analizza PDF</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-zinc-200/80 h-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">
              Incolla testo linee guida
            </CardTitle>
            <CardDescription>
              Incolla il testo estratto dal PDF (o da altre fonti) per indicizzarlo nel motore RAG.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 max-w-xl">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setMessage(null);
                if (!rawTextTitle.trim()) {
                  setMessage({
                    type: "error",
                    text: "Inserisci un titolo per il documento.",
                  });
                  return;
                }
                if (!rawText.trim()) {
                  setMessage({
                    type: "error",
                    text: "Incolla il testo delle linee guida o del documento.",
                  });
                  return;
                }

                try {
                  setIsSubmittingText(true);
                  const tagsArray = rawTextTags
                    ? rawTextTags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    : [];

                  const res = await fetch("/api/admin/ingest-guidelines", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: rawTextTitle,
                      text: rawText,
                      tags: tagsArray,
                    }),
                  });

                  if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    const errMsg =
                      (data && (data.error as string | undefined)) ||
                      "Errore durante l'indicizzazione del testo.";
                    throw new Error(errMsg);
                  }

                  const data = await res.json();
                  if (data.status === "ok") {
                    setMessage({
                      type: "success",
                      text: `Testo indicizzato con successo (${data.chunks ?? "n"} chunk).`,
                    });
                  } else if (data.status === "partial") {
                    setMessage({
                      type: "error",
                      text:
                        data.warning ??
                        "Il testo è stato elaborato ma non indicizzato correttamente in Pinecone. Verifica la configurazione.",
                    });
                  } else {
                    setMessage({
                      type: "error",
                      text:
                        (data.error as string | undefined) ??
                        "Risposta inattesa dal servizio di indicizzazione.",
                    });
                  }
                  setRawTextTitle("");
                  setRawTextTags("");
                  setRawText("");
                } catch (error: any) {
                  setMessage({
                    type: "error",
                    text: error?.message ?? "Impossibile indicizzare il testo.",
                  });
                } finally {
                  setIsSubmittingText(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Titolo del documento
                </label>
                <Input
                  type="text"
                  placeholder="Es. Legge Gelli-Bianco, testo coordinato"
                  value={rawTextTitle}
                  onChange={(e) => setRawTextTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Tags (separati da virgola)
                </label>
                <Input
                  type="text"
                  placeholder="Es. legale, gelli-bianco, responsabilità"
                  value={rawTextTags}
                  onChange={(e) => setRawTextTags(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Testo delle linee guida / normativa
                </label>
                <Textarea
                  className="min-h-40 text-xs"
                  placeholder="Incolla qui il testo estratto dal PDF o dalla fonte ufficiale..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  size="md"
                  disabled={isSubmittingText || !rawTextTitle.trim() || !rawText.trim()}
                  className="px-4"
                >
                  {isSubmittingText ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Indicizzazione in corso…</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Indicizza testo</span>
                    </>
                  )}
                </Button>

                {message && (
                  <div
                    className={
                      message.type === "success"
                        ? "rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-[11px] text-emerald-700"
                        : "rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1 text-[11px] text-rose-700"
                    }
                  >
                    {message.text}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

