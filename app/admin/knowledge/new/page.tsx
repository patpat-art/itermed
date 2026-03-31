"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Upload, Loader2, FileText, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";

export default function NewKnowledgePage() {
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

  const handleSubmitPdf = async (event: FormEvent<HTMLFormElement>) => {
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

      const res = await fetch("/api/admin/ingest-pdf", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && (data.error as string | undefined)) || "Errore upload PDF.");
      }

      setMessage({
        type: "success",
        text: `Documento indicizzato con successo (${data?.chunks ?? "n"} chunk).`,
      });
      setTitle("");
      setTags("");
      setFile(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Errore durante l'upload del PDF." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitText = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!rawTextTitle.trim()) {
      setMessage({ type: "error", text: "Inserisci un titolo per il documento." });
      return;
    }
    if (!rawText.trim()) {
      setMessage({ type: "error", text: "Incolla il testo delle linee guida." });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rawTextTitle,
          text: rawText,
          tags: tagsArray,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && (data.error as string | undefined)) || "Errore durante l'indicizzazione.",
        );
      }

      setMessage({
        type: "success",
        text: `Testo indicizzato con successo (${data?.chunks ?? "n"} chunk).`,
      });
      setRawTextTitle("");
      setRawTextTags("");
      setRawText("");
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "Errore durante l'indicizzazione." });
    } finally {
      setIsSubmittingText(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950">Aggiungi guideline</h1>
          <p className="text-sm text-zinc-500">
            Carica un PDF o incolla testo per indicizzazione nel motore RAG.
          </p>
        </div>
        <Link href="/admin/knowledge">
          <Button type="button" size="sm" variant="outline" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Torna elenco
          </Button>
        </Link>
      </header>

      {message ? (
        <div
          className={
            message.type === "success"
              ? "rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-2 text-xs text-emerald-700"
              : "rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-2 text-xs text-rose-700"
          }
        >
          {message.text}
        </div>
      ) : null}

      <main className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Carica documento PDF</CardTitle>
            <CardDescription>
              Carica linee guida in PDF per indicizzazione automatica in chunk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmitPdf} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Titolo</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Tags</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="es. legale, cardiologia"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">File PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="block w-full text-xs text-zinc-500 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-200 file:px-4 file:py-1.5 file:text-xs file:font-medium"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" size="md" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Upload in corso…</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Carica PDF</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Incolla testo</CardTitle>
            <CardDescription>Inserisci testo manuale da indicizzare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmitText} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Titolo</label>
                <Input value={rawTextTitle} onChange={(e) => setRawTextTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Tags</label>
                <Input
                  value={rawTextTags}
                  onChange={(e) => setRawTextTags(e.target.value)}
                  placeholder="es. gelli-bianco, responsabilità"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Testo</label>
                <Textarea
                  className="min-h-40 text-xs"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="md"
                disabled={isSubmittingText || !rawTextTitle.trim() || !rawText.trim()}
              >
                {isSubmittingText ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Indicizzazione…</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Indicizza testo</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
