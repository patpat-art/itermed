import { openai } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getPineconeIndex } from "../../../lib/pinecone";
import { getSessionUserId } from "../../../lib/api-session";
import { userCanPlayCase } from "../../../lib/access";

const EvaluationSchema = z.object({
  scores: z.object({
    clinical: z.number().min(0).max(100),
    legal: z.number().min(0).max(100),
    exams: z.number().min(0).max(100),
    economy: z.number().min(0).max(100),
    empathy: z.number().min(0).max(100),
  }),
  feedback: z.object({
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    clinicalNote: z.string(),
    legalComplianceNote: z.string(),
    prescribingNote: z.string(),
    empathyNote: z.string(),
    economyNote: z.string(),
    correctSolution: z.string(),
  }),
  evidence: z.object({
    legalSources: z.array(z.string()).default([]),
    protocolSources: z.array(z.string()).default([]),
  }),
});

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ExamPayload = {
  id: string;
  name: string;
  cost: number;
  timeMinutes: number;
};

export async function POST(req: Request) {
  const body = await req.json();
  const {
    caseId,
    chatHistory,
    exams,
    reportText,
    caseContext,
    finalDiagnosis,
  }: {
    caseId: string;
    chatHistory: ChatMessage[];
    exams: ExamPayload[];
    reportText: string;
    caseContext?: string;
    finalDiagnosis?: string;
  } = body;

  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const allowed = await userCanPlayCase(userId, caseId);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Retrieval (best-effort) con filtri tag:
  // - legal: tag "legale"
  // - protocols: tag "protocollo"/"linee guida"
  let retrievedLegalText = "";
  let retrievedProtocolText = "";
  let retrievedLegalSources: string[] = [];
  let retrievedProtocolSources: string[] = [];

  try {
    const index = getPineconeIndex();

    // usiamo retrieval solo se Pinecone è configurato correttamente
    if (index && process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: `${finalDiagnosis ?? ""}\n${reportText ?? ""}`.trim() || reportText,
      });

      const namespace = index.namespace("guidelines");

      const [legalRes, protocolRes] = await Promise.all([
        namespace.query({
          topK: 4,
          vector: embedding,
          includeMetadata: true,
          filter: {
            tags: { $in: ["legale", "gelli-bianco", "gelli bianco"] },
          } as any,
        }),
        namespace.query({
          topK: 4,
          vector: embedding,
          includeMetadata: true,
          filter: {
            tags: { $in: ["protocollo", "protocolli", "linee guida", "linee-guida"] },
          } as any,
        }),
      ]);

      const legalMatches = legalRes.matches ?? [];
      const protocolMatches = protocolRes.matches ?? [];

      const legalChunks = legalMatches
        .map((m) => (m.metadata as any)?.content as string | undefined)
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0);
      const protocolChunks = protocolMatches
        .map((m) => (m.metadata as any)?.content as string | undefined)
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0);

      retrievedLegalSources = legalMatches
        .map((m) => (m.metadata as any)?.title as string | undefined)
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .slice(0, 4);
      retrievedProtocolSources = protocolMatches
        .map((m) => (m.metadata as any)?.title as string | undefined)
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .slice(0, 4);

      if (legalChunks.length > 0) {
        retrievedLegalText = legalChunks.join("\n---\n");
      }
      if (protocolChunks.length > 0) {
        retrievedProtocolText = protocolChunks.join("\n---\n");
      }
    }
  } catch {
    // se Pinecone o embedding falliscono, andiamo avanti senza retrieval
    retrievedLegalText = "";
    retrievedProtocolText = "";
    retrievedLegalSources = [];
    retrievedProtocolSources = [];
  }

  const totalCost = exams.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const totalMinutes = exams.reduce((sum, e) => sum + (Number(e.timeMinutes) || 0), 0);

  const { object } = await generateObject({
    model: openai("gpt-4.1"),
    schema: EvaluationSchema,
    system: `
Sei un "giudice" clinico-medico-legale per la piattaforma IterMed.
Valuti in modo strutturato le scelte del medico in una simulazione.

CONTESTO CASO (se disponibile):
"""${caseContext || "N/D"}"""

DATI DISPONIBILI:
- Storico della comunicazione medico-paziente (chat).
- Elenco degli esami richiesti con costo e tempo.
- Referto finale redatto dal medico.
- Diagnosi finale testuale inserita dal medico (se presente).

DIMENSIONI DI VALUTAZIONE (0–100):
- clinical: accuratezza clinica complessiva, coerenza del ragionamento, gestione del rischio.
- legal: tutela medico-legale, con particolare attenzione all'aderenza alla Legge Gelli-Bianco
         e alle linee guida/buone pratiche accreditate.
- exams: appropriatezza prescrittiva di esami e accertamenti, evitando sia under- che over-utilizzo.
- economy: sostenibilità economica e organizzativa delle scelte, considerando tempi, costi e setting assistenziale.
- empathy: qualità della comunicazione, ascolto, chiarezza, rassicurazione, rispetto del paziente.

ISTRUZIONI:
- Sii severo ma costruttivo, come in una simulazione avanzata per specialisti.
- Penalizza in modo deciso:
  - esami inutili, ridondanti o incongrui rispetto al quadro clinico;
  - omissioni gravi di esami/azioni standard di sicurezza;
  - referti vaghi, non tracciabili o poco difendibili da un punto di vista medico-legale;
  - comunicazione frettolosa, poco chiara o non empatica, soprattutto in contesti ad alta complessità emotiva.
- Nel campo "correctSolution" fornisci una sintesi strutturata di come un medico esperto,
  aderente a linee guida e Legge Gelli-Bianco, avrebbe dovuto gestire il caso
  (inclusi passaggi chiave, esami essenziali e ragionamento difendibile).
- Quando valuti la LEGAL COMPLIANCE, DEVI basarti rigorosamente sugli estratti ufficiali (tag: legale):

  """${retrievedLegalText || "Nessun estratto legale recuperato: valuta secondo buona pratica medico-legale generale."}"""

- Quando valuti l'APPROPRIATEZZA PRESCRITTIVA, DEVI basarti rigorosamente sugli estratti di protocolli/linee guida (tag: protocollo/linee guida):

  """${retrievedProtocolText || "Nessun estratto protocollo recuperato: valuta secondo buona pratica clinica generale."}"""

- In economy tieni conto anche del costo totale degli esami richiesti.

- NON restituire spiegazioni al di fuori del JSON previsto; usa solo i campi dello schema.
`.trim(),
    prompt: `
STORICO CHAT (medico ↔ paziente):
${chatHistory
  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")}

ESAMI RICHIESTI:
${exams
  .map(
    (e) => `- ${e.name} (costo: €${e.cost}, tempo: ${e.timeMinutes} min)`,
  )
  .join("\n") || "Nessun esame richiesto."}

REFERTO FINALE DEL MEDICO:
"""${reportText}"""

DIAGNOSI FINALE INSERITA:
"""${finalDiagnosis ?? ""}"""

RIASSUNTO COSTI/TEMPI:
- costo totale esami: €${totalCost}
- tempo totale esami: ${totalMinutes} minuti
`.trim(),
  });

  const { scores, feedback } = object;

  // Per ora usiamo la media semplice come totalScore.
  const totalScore =
    (scores.clinical +
      scores.legal +
      scores.exams +
      scores.economy +
      scores.empathy) /
    5;

  const session = await prisma.sessionReport.create({
    data: {
      userId,
      caseId,
      clinicalAccuracy: scores.clinical,
      legalComplianceGelliBianco: scores.legal,
      prescribingAppropriateness: scores.exams,
      economicSustainability: scores.economy,
      empathy: scores.empathy,
      totalScore,
      rawTrace: {
        chatHistory,
        exams,
        reportText,
        feedback,
        evidence: object.evidence,
      },
      notes: feedback.legalComplianceNote,
    },
  });

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      scores,
      feedback,
      evidence: object.evidence,
      totalScore,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

