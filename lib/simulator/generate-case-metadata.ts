import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export type AiGeneratedCaseProfile = {
  title: string;
  specialty: string;
  age: string;
  sex: "M" | "F" | "";
  context: string;
  description: string;
  pastHistory: string;
  correctSolution: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

/** Chiavi allineate ai `name` del form creazione caso (esame obiettivo). */
export type AiGeneratedObjective = {
  vitals_fc: string;
  vitals_pa: string;
  vitals_spo2: string;
  vitals_temp: string;
  vitals_fr: string;
  thorax_cardiac: string;
  thorax_lung: string;
  abdomen_inspection: string;
  abdomen_palpation: string;
  abdomen_percussion: string;
  neuro_pupils: string;
  neuro_gcs: string;
  neuro_deficits: string;
};

const EMPTY_OBJECTIVE: AiGeneratedObjective = {
  vitals_fc: "",
  vitals_pa: "",
  vitals_spo2: "",
  vitals_temp: "",
  vitals_fr: "",
  thorax_cardiac: "",
  thorax_lung: "",
  abdomen_inspection: "",
  abdomen_palpation: "",
  abdomen_percussion: "",
  neuro_pupils: "",
  neuro_gcs: "",
  neuro_deficits: "",
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normalizeDifficulty(v: unknown): "EASY" | "MEDIUM" | "HARD" {
  const s = str(v).toUpperCase();
  if (s === "EASY" || s === "HARD" || s === "MEDIUM") return s;
  return "MEDIUM";
}

function normalizeSex(v: unknown): "M" | "F" | "" {
  const s = str(v).toUpperCase();
  if (s === "M" || s === "MALE" || s === "MASCHIO") return "M";
  if (s === "F" || s === "FEMALE" || s === "FEMMINA") return "F";
  return "";
}

export function parseCaseAndObjectiveJson(raw: string): {
  caseProfile: AiGeneratedCaseProfile;
  objective: AiGeneratedObjective;
} | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const root = parsed as Record<string, unknown>;
  const c = root.case;
  const o = root.objective;
  if (!c || typeof c !== "object" || Array.isArray(c)) return null;
  const co = c as Record<string, unknown>;
  const caseProfile: AiGeneratedCaseProfile = {
    title: str(co.title),
    specialty: str(co.specialty),
    age: str(co.age),
    sex: normalizeSex(co.sex),
    context: str(co.context),
    description: str(co.description),
    pastHistory: str(co.pastHistory),
    correctSolution: str(co.correctSolution),
    difficulty: normalizeDifficulty(co.difficulty),
  };

  const objective = { ...EMPTY_OBJECTIVE };
  if (o && typeof o === "object" && !Array.isArray(o)) {
    const oo = o as Record<string, unknown>;
    for (const k of Object.keys(EMPTY_OBJECTIVE) as (keyof AiGeneratedObjective)[]) {
      objective[k] = str(oo[k]);
    }
  }

  return { caseProfile, objective };
}

type MetadataInput = {
  caseDescription: string;
  diagnosis: string;
  age: string;
  sex: string;
};

export async function generateCaseMetadataAndObjective(
  input: MetadataInput,
): Promise<{ caseProfile: AiGeneratedCaseProfile; objective: AiGeneratedObjective } | null> {
  const { caseDescription, diagnosis, age, sex } = input;

  const systemPrompt = `Sei un medico primario esperto. In base al contesto clinico fornito, devi produrre SOLO un oggetto JSON valido (nessun markdown, nessun testo fuori dal JSON) con questa struttura esatta:

{
  "case": {
    "title": "titolo breve del caso per il simulatore (max ~80 caratteri)",
    "specialty": "es. Emergenza, Cardiologia, Medicina interna",
    "age": "età come stringa numerica, es. 62",
    "sex": "M oppure F",
    "context": "una riga: contesto di accesso (es. PS, guardia medica)",
    "description": "2-5 frasi: motivo di accesso, sintomi chiave, obiettivo formativo implicito",
    "pastHistory": "comorbilità rilevanti o 'Nessuna comorbilità significativa' se assenti",
    "correctSolution": "diagnosi attesa e linee guida essenziali di gestione (per l'autore del caso)",
    "difficulty": "EASY o MEDIUM o HARD in base alla complessità clinica e medico-legale"
  },
  "objective": {
    "vitals_fc": "frequenza cardiaca con unità se serve",
    "vitals_pa": "pressione arteriosa es. 130/80 mmHg",
    "vitals_spo2": "saturazione con %",
    "vitals_temp": "temperatura °C",
    "vitals_fr": "frequenza respiratoria",
    "thorax_cardiac": "breve auscultazione / toni / soffi",
    "thorax_lung": "MV, rumori aggiunti, versamento, ecc.",
    "abdomen_inspection": "ispezione addominale",
    "abdomen_palpation": "palpazione",
    "abdomen_percussion": "percussione",
    "neuro_pupils": "pupille",
    "neuro_gcs": "GCS o stato di coscienza",
    "neuro_deficits": "deficit focali o 'Non evidenziati' se assenti"
  }
}

Regole:
- Tutti i campi sono stringhe in italiano, sintetici ma clinici.
- Coerenza interna tra parametri vitali, torace, addome, neuro e il quadro descritto.
- NON inventare dettagli assurdi rispetto al contesto.`;

  const userContent = `Contesto disponibile:

Descrizione narrativa del caso (può essere vuota se non fornita):
"""
${caseDescription || "(non fornita)"}
"""

Diagnosi / soluzione indicata dall'autore (può essere vuota):
"""
${diagnosis || "(non fornita)"}
"""

Dati anagrafici già noti nel modulo (integrali se coerenti, altrimenti correggi solo se il contesto è chiaro): età: ${age || "non specificata"}, sesso: ${sex || "non specificato"}.

Genera l'oggetto JSON richiesto.`;

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.35,
  });

  const parsed = parseCaseAndObjectiveJson(result.text);
  return parsed;
}
