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
};

type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

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
5. Se il Livello di Stress è > 70, sii estremamente ansioso, lamentati del dolore e rispondi a fatica. Se lo stress è > 90, smetti quasi di rispondere, limitandoti a gemiti o frasi sconnesse.`;

  return systemPrompt;
}

export function generatePatientResponse(params: {
  caseData: PatientSimulatorCaseInput;
  messages: ChatTurn[];
}) {
  const systemPrompt = buildPatientSystemPrompt(params.caseData);

  return streamText({
    model: openai("gpt-4o-mini"),
    messages: [{ role: "system", content: systemPrompt }, ...params.messages],
  });
}
