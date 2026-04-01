import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getSessionUserId } from "../../../lib/api-session";
import { EXAM_DEFAULT_VALUES } from "../../../lib/exam-default-values";
import { mergeExamProfile, parseLlmExamJson } from "../../../lib/merge-exam-profile";

type AbnormalExamInput = { examId: string; value: string };

const MIN_CASE_DESCRIPTION_LEN = 25;

/** Accetta solo chiavi presenti nel dizionario esami. */
function filterExamKeysToDictionary(
  map: Record<string, string>,
  dictionary: typeof EXAM_DEFAULT_VALUES,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (dictionary[k] && typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
}

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
    caseDescription?: string | null;
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
  const caseDescription =
    typeof body.caseDescription === "string" ? body.caseDescription.trim() : "";
  const abnormalExams = Array.isArray(body.abnormalExams) ? body.abnormalExams : [];

  const hasGuidedDiagnosis = diagnosis.length > 0;
  const hasCaseBrief = caseDescription.length >= MIN_CASE_DESCRIPTION_LEN;

  if (!hasGuidedDiagnosis && !hasCaseBrief) {
    return Response.json(
      {
        error: `Inserisci la diagnosi / soluzione corretta, oppure una descrizione del caso di almeno ${MIN_CASE_DESCRIPTION_LEN} caratteri (modalità AI da testo libero).`,
      },
      { status: 400 },
    );
  }

  const abnormalExams_JSON = JSON.stringify(
    abnormalExams.map((e) => ({
      examId: e.examId,
      value: e.value,
    })),
  );

  const examIdCatalog = Object.keys(EXAM_DEFAULT_VALUES).join(", ");

  let systemPrompt: string;

  if (hasCaseBrief) {
    systemPrompt = `Sei un medico primario esperto. Il tuo compito è definire il profilo di esami di laboratorio e strumentali (referti / valori) per un simulatore medico, a partire dalla descrizione narrativa del caso fornita dall'autore.

DESCRIZIONE DEL CASO (fonte principale):
"""
${caseDescription}
"""

Dati anagrafici già indicati nel modulo (se presenti): ${age ? `${age} anni` : "non specificata"}, sesso: ${sex || "non specificato"}.
${diagnosis ? `Nota aggiuntiva dell'autore su diagnosi/gestione attesa (opzionale): ${diagnosis}` : ""}

Esami già segnati dall'autore come alterati/chiave (hanno priorità; integrali se coerenti):
${abnormalExams_JSON}

Catalogo esami del simulatore — usa SOLO questi identificativi esatti come chiavi JSON (exam_id):
${examIdCatalog}

Istruzioni:
- Interpreta il caso clinico e imposta i referti/valori per tutti gli esami che in questo scenario dovrebbero risultare alterati, borderline o comunque non neutri rispetto al default.
- Includi alterazioni primarie e, se plausibili, secondarie coerenti (es. flogosi, disfunzione d'organo, esiti strumentali attesi).
- NON includere chiavi per esami che restano nella norma: il sistema applicherà i valori predefiniti.
- Ogni valore deve essere una stringa concisa con unità o referto sintetico da laboratorio/strumentale.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido:
{
  "exam_id": "valore o referto con unità",
  ...
}
Non aggiungere markdown, spiegazioni o testo fuori dal JSON.`;
  } else {
    systemPrompt = `Sei un medico primario esperto. Il tuo compito è completare il quadro clinico di un paziente per un simulatore medico.
L'autore del caso ha definito questa diagnosi: ${diagnosis}.
Paziente: ${age} anni, ${sex}.
L'autore ha già impostato questi esami alterati/chiave:
${abnormalExams_JSON}

Il tuo compito:
Analizza la patologia e i valori alterati. Ci sono altri esami (tra quelli standard di laboratorio e strumentali) che, pur non essendo il focus principale, DOVREBBERO essere leggermente fuori norma o adattati per mantenere una rigorosa coerenza fisiologica (es. meccanismi compensatori, indici di flogosi secondari)?
Se sì, genera i valori per questi esami "secondari".
Se un esame non è correlato alla patologia e può rimanere strettamente nella norma, NON includerlo nel tuo output (il sistema userà i valori di default).

Chiavi ammesse (exam_id): ${examIdCatalog}

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido con questa struttura:
{
  "exam_id_1": "valore generato con unità di misura",
  "exam_id_2": "valore generato con unità di misura"
}
Non aggiungere markdown, spiegazioni o testo fuori dal JSON.`;
  }

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
    llmMap = filterExamKeysToDictionary(parseLlmExamJson(llmText), EXAM_DEFAULT_VALUES);
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
