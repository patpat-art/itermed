import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getSessionUserId } from "../../../lib/api-session";
import { EXAM_DEFAULT_VALUES } from "../../../lib/exam-default-values";
import { mergeExamProfile, parseLlmExamJson } from "../../../lib/merge-exam-profile";

type AbnormalExamInput = { examId: string; value: string };

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY non configurata sul server." },
      { status: 503 },
    );
  }

  let body: {
    age?: string | number | null;
    sex?: string | null;
    diagnosis?: string | null;
    abnormalExams?: AbnormalExamInput[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const age = body.age != null ? String(body.age) : "";
  const sex = body.sex != null ? String(body.sex) : "";
  const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() : "";
  const abnormalExams = Array.isArray(body.abnormalExams) ? body.abnormalExams : [];

  if (!diagnosis) {
    return Response.json(
      { error: "La diagnosi / soluzione corretta è obbligatoria per la generazione." },
      { status: 400 },
    );
  }

  const abnormalExams_JSON = JSON.stringify(
    abnormalExams.map((e) => ({
      examId: e.examId,
      value: e.value,
    })),
  );

  const systemPrompt = `Sei un medico primario esperto. Il tuo compito è completare il quadro clinico di un paziente per un simulatore medico.
L'autore del caso ha definito questa diagnosi: ${diagnosis}.
Paziente: ${age} anni, ${sex}.
L'autore ha già impostato questi esami alterati/chiave:
${abnormalExams_JSON}

Il tuo compito:
Analizza la patologia e i valori alterati. Ci sono altri esami (tra quelli standard di laboratorio e strumentali) che, pur non essendo il focus principale, DOVREBBERO essere leggermente fuori norma o adattati per mantenere una rigorosa coerenza fisiologica (es. meccanismi compensatori, indici di flogosi secondari)?
Se sì, genera i valori per questi esami "secondari".
Se un esame non è correlato alla patologia e può rimanere strettamente nella norma, NON includerlo nel tuo output (il sistema userà i valori di default).

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido con questa struttura:
{
  "exam_id_1": "valore generato con unità di misura",
  "exam_id_2": "valore generato con unità di misura"
}
Non aggiungere markdown, spiegazioni o testo fuori dal JSON.`;

  let llmText = "";
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Genera solo l'oggetto JSON richiesto. Usa gli stessi exam_id del dizionario interno del simulatore (es. troponina-hs, pcr-pct).",
        },
      ],
      temperature: 0.4,
    });
    llmText = result.text;
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Errore nella chiamata al modello linguistico." },
      { status: 502 },
    );
  }

  let llmMap: Record<string, string> = {};
  try {
    llmMap = parseLlmExamJson(llmText);
  } catch {
    return Response.json(
      { error: "Risposta AI non è JSON valido. Riprova.", raw: llmText.slice(0, 500) },
      { status: 422 },
    );
  }

  const abnormalMap: Record<string, string> = {};
  for (const row of abnormalExams) {
    if (row.examId && typeof row.value === "string" && row.value.trim()) {
      abnormalMap[row.examId] = row.value.trim();
    }
  }

  const merged = mergeExamProfile(EXAM_DEFAULT_VALUES, abnormalMap, llmMap);

  return Response.json({
    merged,
    llmAdjustments: llmMap,
  });
}
