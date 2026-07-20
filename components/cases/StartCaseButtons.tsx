"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type StartCaseButtonsProps = {
  caseId: string;
  /** Se fornito, avvia la sessione senza navigazione diretta (master-detail Prassi). */
  onSessionStart?: (caseId: string, sessionId: string) => void;
  /** Destinazione di fallback se `onSessionStart` non è passato. */
  playBasePath?: string;
};

export function StartCaseButtons({
  caseId,
  onSessionStart,
  playBasePath = "/dashboard/prassi/play",
}: StartCaseButtonsProps) {
  const router = useRouter();
  const [isStartingOriginal, setIsStartingOriginal] = useState(false);
  const [isStartingVariant, setIsStartingVariant] = useState(false);

  const start = async (mode: "original" | "variant") => {
    try {
      if (mode === "original") {
        setIsStartingOriginal(true);
      } else {
        setIsStartingVariant(true);
      }

      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, mode }),
      });

      if (!res.ok) {
        throw new Error("Errore nell'avvio della sessione.");
      }

      const data = (await res.json()) as { sessionId: string };
      if (onSessionStart) {
        onSessionStart(caseId, data.sessionId);
      } else {
        router.push(`${playBasePath}/${caseId}?sessionId=${data.sessionId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingOriginal(false);
      setIsStartingVariant(false);
    }
  };

  const isBusy = isStartingOriginal || isStartingVariant;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => start("original")}
        disabled={isBusy}
      >
        {isStartingOriginal ? "Avvio..." : "Gioca caso originale"}
      </button>
      <button
        type="button"
        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1E324E] px-4 py-2 font-display text-sm font-medium text-white transition-colors hover:bg-[#2A486D] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => start("variant")}
        disabled={isBusy}
      >
        {isStartingVariant ? (
          "Generazione variante..."
        ) : (
          <>
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            Genera variante IA
          </>
        )}
      </button>
    </div>
  );
}
