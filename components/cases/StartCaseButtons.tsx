"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "../../app/ui/button";

type StartCaseButtonsProps = {
  caseId: string;
};

export function StartCaseButtons({ caseId }: StartCaseButtonsProps) {
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
      router.push(`/case/${caseId}?sessionId=${data.sessionId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingOriginal(false);
      setIsStartingVariant(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="text-[11px]"
        onClick={() => start("original")}
        disabled={isStartingOriginal || isStartingVariant}
      >
        {isStartingOriginal ? "Avvio..." : "Gioca caso originale"}
      </Button>
      <Button
        type="button"
        size="sm"
        className="text-[11px] bg-purple-600 hover:bg-purple-700 text-white"
        onClick={() => start("variant")}
        disabled={isStartingOriginal || isStartingVariant}
      >
        {isStartingVariant ? (
          "Generazione variante..."
        ) : (
          <>
            <Sparkles className="w-3 h-3 mr-1" />
            Genera variante IA
          </>
        )}
      </Button>
    </div>
  );
}

