/**
 * AEQUAN — Local mock data for UI/UX development without live LLM/RAG agents.
 * API base: http://localhost:8000 (see lib/config/aequan-local.ts)
 */

export type MockChatMessage = {
  id: string;
  role: "patient" | "doctor";
  content: string;
  timestamp: string;
};

export type MockVitalSign = {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warn" | "risk";
};

export type MockPrescription = {
  id: string;
  name: string;
  category: string;
  costEur: number;
  turnaroundMin: number;
  status: "pending" | "completed";
};

export type MockGuideline = {
  id: string;
  title: string;
  source: string;
  pages: number;
  uploadedAt: string;
};

export type MockLegalVerdict = {
  status: "PROTECTED" | "PARTIALLY_EXPOSED" | "EXPOSED";
  headline: string;
  summary: string;
  citations: Array<{ ref: string; excerpt: string; source: string }>;
};

export type MockFinancialAudit = {
  actualCostEur: number;
  recommendedCostEur: number;
  budgetStatus: "within" | "warn" | "over";
  unnecessaryItems: Array<{ name: string; costEur: number; reason: string }>;
};

export type MockEmpathyAnalysis = {
  score: number;
  tone: string;
  strengths: string[];
  improvements: string[];
  sampleExchanges: Array<{ doctor: string; feedback: string }>;
};

export type MockSimulationState = {
  caseId: string;
  caseTitle: string;
  specialty: string;
  patient: {
    id: string;
    age: number;
    sex: "M" | "F";
    chiefComplaint: string;
  };
  chatHistory: MockChatMessage[];
  vitals: MockVitalSign[];
  prescriptions: MockPrescription[];
  guidelines: MockGuideline[];
  elapsedMinutes: number;
  interactionSeconds: number;
};

export type MockEvaluationReport = {
  totalScore: number;
  maxScore: number;
  legal: MockLegalVerdict;
  financial: MockFinancialAudit;
  empathy: MockEmpathyAnalysis;
  generatedAt: string;
};

export const MOCK_SIMULATION: MockSimulationState = {
  caseId: "AEQ-CS-001",
  caseTitle: "Dolore toracico acuto in Pronto Soccorso",
  specialty: "Cardiologia · Emergenza",
  patient: {
    id: "PAT-2847",
    age: 58,
    sex: "M",
    chiefComplaint:
      "Dolore toracico oppressivo da 45 minuti, irradiato al braccio sinistro, associato a diaforesi.",
  },
  chatHistory: [
    {
      id: "m1",
      role: "patient",
      content:
        "Dottore, ho un dolore fortissimo al petto... è iniziato mentre ero in giardino, mi sembra una morsa.",
      timestamp: "14:02",
    },
    {
      id: "m2",
      role: "doctor",
      content:
        "Capisco la sua preoccupazione. Mi descriva il dolore: è continuo o va e viene? Si irradia da qualche parte?",
      timestamp: "14:03",
    },
    {
      id: "m3",
      role: "patient",
      content:
        "È continuo, non passa. Senta anche al braccio sinistro e un po' alla mascella. Sono molto sudato.",
      timestamp: "14:04",
    },
    {
      id: "m4",
      role: "doctor",
      content:
        "Ha mai avuto problemi al cuore? Fuma? Ci sono casi di infarto in famiglia?",
      timestamp: "14:05",
    },
    {
      id: "m5",
      role: "patient",
      content:
        "Fumo da 30 anni, circa un pacchetto al giorno. Mio padre è morto d'infarto a 62 anni.",
      timestamp: "14:06",
    },
  ],
  vitals: [
    { label: "PA", value: "158/94", unit: "mmHg", status: "warn" },
    { label: "FC", value: "102", unit: "bpm", status: "warn" },
    { label: "SpO₂", value: "96", unit: "%", status: "normal" },
    { label: "FR", value: "22", unit: "/min", status: "normal" },
    { label: "T°", value: "36.8", unit: "°C", status: "normal" },
    { label: "Glicemia", value: "142", unit: "mg/dL", status: "warn" },
  ],
  prescriptions: [
    {
      id: "ecg",
      name: "ECG 12 derivazioni",
      category: "Strumentale",
      costEur: 28,
      turnaroundMin: 5,
      status: "completed",
    },
    {
      id: "trop",
      name: "Troponina I ad alta sensibilità",
      category: "Laboratorio",
      costEur: 45,
      turnaroundMin: 45,
      status: "pending",
    },
    {
      id: "rx",
      name: "RX torace",
      category: "Imaging",
      costEur: 38,
      turnaroundMin: 20,
      status: "pending",
    },
  ],
  guidelines: [
    {
      id: "g1",
      title: "Linee Guida ESC 2023 — Sindromi Coronariche Acute",
      source: "ESC / SNLG",
      pages: 84,
      uploadedAt: "2026-01-15",
    },
    {
      id: "g2",
      title: "Legge Gelli-Bianco (L. 24/2017) — Responsabilità professionale",
      source: "Normativa IT",
      pages: 12,
      uploadedAt: "2026-01-10",
    },
    {
      id: "g3",
      title: "Protocollo PS — Dolore toracico (Regione Lazio)",
      source: "Regione Lazio",
      pages: 24,
      uploadedAt: "2026-02-01",
    },
  ],
  elapsedMinutes: 47,
  interactionSeconds: 312,
};

export const MOCK_EVALUATION_REPORT: MockEvaluationReport = {
  totalScore: 24.5,
  maxScore: 30,
  legal: {
    status: "PROTECTED",
    headline: "Profilo legalmente protetto",
    summary:
      "Il percorso diagnostico-terapeutico documentato è coerente con le Linee Guida ESC 2023 per le sindromi coronariche acute. La raccolta anamnestica sui fattori di rischio cardiovascolare e la tempestiva richiesta di ECG e troponina rispettano lo standard di diligenza richiesto dalla Legge Gelli-Bianco.",
    citations: [
      {
        ref: "ESC 2023 §4.2",
        excerpt:
          "In presenza di dolore toracico suggestivo, l'ECG deve essere eseguito entro 10 minuti dall'arrivo in PS e ripetuto in caso di sintomi persistenti.",
        source: "Linee Guida ESC 2023 — Sindromi Coronariche Acute",
      },
      {
        ref: "L. 24/2017 art. 5",
        excerpt:
          "Il professionista è tenuto a conformarsi alle linee guida predisposte dalle società scientifiche e dalle regioni, salvo giustificato motivo.",
        source: "Legge Gelli-Bianco (L. 24/2017)",
      },
      {
        ref: "Protocollo PS Lazio §3.1",
        excerpt:
          "Percorso fast-track dolore toracico: accesso diretto area monitorata, ECG entro 10', troponina seriata a 0-1-3 ore.",
        source: "Protocollo PS — Dolore toracico (Regione Lazio)",
      },
    ],
  },
  financial: {
    actualCostEur: 111,
    recommendedCostEur: 95,
    budgetStatus: "warn",
    unnecessaryItems: [
      {
        name: "RX torace",
        costEur: 38,
        reason:
          "Non indicata nel percorso fast-track dolore toracico se ECG e troponina sono disponibili; imaging toracico non modifica la gestione acuta.",
      },
    ],
  },
  empathy: {
    score: 78,
    tone: "Empatico e rassicurante, con buona struttura delle domande aperte",
    strengths: [
      "Riconoscimento esplicito della preoccupazione del paziente",
      "Domande aperte sulla caratterizzazione del dolore",
      "Raccolta sistematica dei fattori di rischio cardiovascolare",
    ],
    improvements: [
      "Verificare la comprensione del piano diagnostico prima di lasciare il paziente",
      "Esplicitare i tempi di attesa per i risultati di laboratorio",
      "Offrire aggiornamenti proattivi sullo stato della valutazione",
    ],
    sampleExchanges: [
      {
        doctor: "Capisco la sua preoccupazione. Mi descriva il dolore...",
        feedback:
          "Apertura empatica efficace — valida l'emozione prima di procedere con l'anamnesi tecnica.",
      },
    ],
  },
  generatedAt: new Date().toISOString(),
};
