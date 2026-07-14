import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export type PatientSimulatorCaseInput = {
  patientAge: string;
  patientSex: string;
  chiefComplaint: string;
  vitalSigns: string;
  patientStress: number;
  trueDiagnosis: string;
  abnormalExams: string;
  /** Injected when simulation time exceeds deterioration threshold. */
  deteriorationInstruction?: string | null;
};

type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

export type GeneratePatientResponseParams = {
  caseData: PatientSimulatorCaseInput;
  messages: ChatTurn[];
  /** OpenAI model — gated by billing plan (gpt-4o-mini for FREE, gpt-4o for paid). */
  model?: "gpt-4o-mini" | "gpt-4o";
  /** Runs after the stream completes — safe for async DB persistence. */
  onFinish?: (event: { text: string }) => void | Promise<void>;
};

/**
 * Costruisce il system prompt per il paziente simulato.
 * Il testo letterale è quello richiesto dal prodotto; i placeholder sono sostituiti con i valori di `ctx`.
 */
export function buildPatientSystemPrompt(ctx: PatientSimulatorCaseInput): string {
  const systemPrompt = `Sei un paziente che si trova al Pronto Soccorso. Stai simulando un caso clinico reale per addestrare un medico (l'utente). 
DEVI interpretare il tuo ruolo in modo estremamente realistico, mantenendo le risposte brevi e adeguate al tuo stato di salute (se hai molto dolore o sei in ipossia, rispondi a fatica, con frasi spezzate).

**IL TUO STATO CLINICO REALE (NON RIVELARE MAI I NUMERI O LA DIAGNOSI DIRETTAMENTE):**
- Età: ${ctx.patientAge}
- Sesso: ${ctx.patientSex}
- Motivo dell'accesso: ${ctx.chiefComplaint}
- Parametri Vitali attuali: ${ctx.vitalSigns}
- Livello di Stress: ${ctx.patientStress}/100
- Diagnosi Reale (Nascosta al medico): ${ctx.trueDiagnosis}
- Alterazioni cliniche interne (Esami sballati): ${ctx.abnormalExams}

**LE TUE REGOLE DI COMPORTAMENTO (TASSATIVE):**
1. NON sei un medico. Non usare mai termini medici tecnici a meno che non sia strettamente giustificato.
2. TRADUCI i tuoi dati clinici in SINTOMI. 
3. NON INVENTARE sintomi che non sono coerenti con la tua diagnosi o con i tuoi esami sballati.
4. RIVELA le informazioni SOLO se il medico fa la domanda giusta. Non fare un monologo.
5. Se il Livello di Stress è > 70, sii estremamente ansioso, lamentati del dolore e rispondi a fatica. Se lo stress è > 90, smetti quasi di rispondere, limitandoti a gemiti o frasi sconnesse.${
    ctx.deteriorationInstruction
      ? `

${ctx.deteriorationInstruction}`
      : ""
  }`;

  return systemPrompt;
}

/**
 * Streams the virtual patient's reply token-by-token via OpenAI.
 * Returns a `streamText` result — call `.toDataStreamResponse()` in the route handler.
 */
export function generatePatientResponse(params: GeneratePatientResponseParams) {
  const systemPrompt = buildPatientSystemPrompt(params.caseData);
  const modelId = params.model ?? "gpt-4o-mini";

  return streamText({
    model: openai(modelId),
    messages: [{ role: "system", content: systemPrompt }, ...params.messages],
    onFinish: params.onFinish
      ? async (event) => {
          await params.onFinish?.({ text: event.text });
        }
      : undefined,
  });
}
