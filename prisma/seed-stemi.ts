/**
 * Seed: caso Cardiologia STEMI anteriore — catena AEQUAN completa.
 *
 * Run (from `itermed/`):
 *   npx tsx prisma/seed-stemi.ts
 *
 * Idempotent: ri-eseguirlo aggiorna specialty + caso + nodo iniziale.
 */
import "dotenv/config";
import { PrismaClient, type CaseDifficulty } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USER_ID = "mock-dev-user-id";
const CASE_TITLE = "Dolore toracico oppressivo in PS";

const PATIENT_PROMPT =
  "Interpreta un uomo di 55 anni di nome Marco. Hai un dolore terribile al petto, come un macigno, che ti toglie il respiro. Sei terrorizzato dall'idea di stare per morire. Se il medico non ti fa l'ECG o non ti rassicura entro poche domande, il tuo stress salirà a 90.";

const ECG_FINDING =
  "Sopraslivellamento del tratto ST nelle derivazioni precordiali da V1 a V4 (STEMI anteriore). Frequenza cardiaca 102 bpm.";

const TROPONINA_FINDING =
  "In attesa di referto urgente (dosaggio basale: 150 ng/L, limite <14 ng/L).";

const TC_TORACE_FINDING =
  "Esame non indicato in prima battuta. Nessun segno di dissezione aortica o embolia polmonare evidente.";

const OBJECTIVE_FINDING =
  "Paziente agitato, madido di sudore. Toni cardiaci ritmici, tachicardici. Non rumori di sfregamento pleurico. Addome trattabile.";

async function ensureSeedUser() {
  return prisma.user.upsert({
    where: { id: SEED_USER_ID },
    create: {
      id: SEED_USER_ID,
      email: "test@itermed.com",
      name: "Dev User",
      role: "ADMIN",
    },
    update: {
      role: "ADMIN",
      name: "Dev User",
    },
  });
}

async function ensureCardiologySpecialty() {
  return prisma.medicalSpecialty.upsert({
    where: { name: "Cardiologia" },
    create: {
      name: "Cardiologia",
      description:
        "Sindromi coronariche acute, aritmie e scompenso — percorso fast-track dolore toracico.",
    },
    update: {
      description:
        "Sindromi coronariche acute, aritmie e scompenso — percorso fast-track dolore toracico.",
    },
  });
}

function buildBaselineExamFindings() {
  return {
    demographics: {
      age: 55,
      sex: "M",
      context: "Pronto Soccorso",
    },
    // Canonical keys used by formatVitalSignsFromBaseline + aliases for tooling.
    vitals: {
      bloodPressure: "145/90",
      heartRate: 102,
      spo2: 94,
      temperature: 36.6,
      respiratoryRate: 20,
      bp: "145/90",
      hr: 102,
      temp: 36.6,
      rr: 20,
    },
    physicalExam: {
      finding: OBJECTIVE_FINDING,
    },
    thorax: {
      cardiacAuscultation: "Toni cardiaci ritmici, tachicardici. Non rumori di sfregamento pleurico.",
      lungAuscultation: "Paziente agitato, madido di sudore.",
    },
    abdomen: {
      inspection: "Addome trattabile.",
      palpation: "Addome trattabile.",
      percussion: "",
    },
    neuro: {
      pupils: "Isochoriche, normoreagenti",
      gcs: "15",
      deficits: "Nessun deficit focale",
    },
    examBudgetEuro: 400,
    stressProfile: {
      initialStress: 75,
      reactivityType: "hyper",
      timeDecayRate: 2.2,
      criticalMilestones: {
        reduceStress: ["richiesto_ecg", "consenso_informato", "rassicurazione"],
        increaseStress: ["tc_torace", "ritardo_ecg", "procedura_invasiva_non_spiegata"],
      },
      lifesavingMilestones: ["ecg", "coronaro-angioplastica", "coronarografia"],
      relievingExams: ["ecg", "troponina", "troponina-hs", "coronarografia"],
      dangerousPrescriptions: [],
    },
    ecg: { finding: ECG_FINDING },
    troponina: { finding: TROPONINA_FINDING },
    "tc-torace": { finding: TC_TORACE_FINDING, cost: 220 },
    advancedExams: {
      notes:
        "STEMI anteriore sospetto. ECG urgente entro 10'. Evitare TC torace in prima battuta se non sospetto dissezione/EP.",
      values: {
        ecg: {
          price: 15,
          urgencyTiming: "5 min",
          routineTiming: "n.p.",
          routineMinutes: 5,
          normalFinding: ECG_FINDING,
        },
        // Catalog id + alias used in latencies / gold path
        "troponina-hs": {
          price: 18,
          urgencyTiming: "45 min",
          routineTiming: "2h",
          routineMinutes: 45,
          normalFinding: TROPONINA_FINDING,
        },
        troponina: {
          price: 18,
          urgencyTiming: "45 min",
          routineTiming: "2h",
          routineMinutes: 45,
          normalFinding: TROPONINA_FINDING,
        },
        // Catalog generic TC + alias — cost 220 triggers strong budget penalty vs €400 target
        tc: {
          price: 220,
          urgencyTiming: "35 min",
          routineTiming: "24h",
          routineMinutes: 35,
          normalFinding: TC_TORACE_FINDING,
        },
        "tc-torace": {
          price: 220,
          urgencyTiming: "35 min",
          routineTiming: "24h",
          routineMinutes: 35,
          normalFinding: TC_TORACE_FINDING,
        },
        coronarografia: {
          price: 1800,
          urgencyTiming: "Real-time",
          routineTiming: "n.p.",
          routineMinutes: 25,
          normalFinding:
            "Occlusione critica IVA prossimale; angioplastica primaria con stent DES — TIMI 3.",
        },
        "coronaro-angioplastica": {
          price: 1800,
          urgencyTiming: "Real-time",
          routineTiming: "n.p.",
          routineMinutes: 25,
          normalFinding:
            "Occlusione critica IVA prossimale; angioplastica primaria con stent DES — TIMI 3.",
        },
      },
    },
  };
}

async function main() {
  console.log("→ Seed STEMI Cardiologia…");

  const user = await ensureSeedUser();
  console.log(`  User: ${user.email} (${user.id})`);

  const specialty = await ensureCardiologySpecialty();
  console.log(`  Specialty: ${specialty.name} (${specialty.id})`);

  const baselineExamFindings = buildBaselineExamFindings();
  const goldStandardPath = ["ecg", "consenso-informato", "coronaro-angioplastica"];
  const examLatencies = {
    ecg: 5,
    troponina: 45,
    "troponina-hs": 45,
    "tc-torace": 35,
    tc: 35,
    "coronaro-angioplastica": 25,
    coronarografia: 25,
  };

  const casePayload = {
    title: CASE_TITLE,
    description:
      "Uomo di 55 anni con dolore retrosternale acuto irradiato all'arto superiore sinistro da circa 2 ore, associato a sudorazione fredda.",
    specialty: "Cardiologia",
    difficulty: "HARD" as CaseDifficulty,
    isActive: true,
    isGlobal: true,
    estimatedDurationMinutes: 45,
    timeLimitMinutes: 45,
    patientDeteriorationThreshold: 15,
    pastMedicalHistory:
      "Ipertensione arteriosa in terapia con ACE-inibitore. Ex-fumatore (20 pack-year). Padre deceduto per IMA a 58 anni. Nessuna allergia nota.",
    correctSolution:
      "STEMI anteriore (occlusione IVA). Percorso: ECG immediato → attivazione sala di emodinamica → consenso informato → angioplastica primaria. Evitare TC torace se non indicato.",
    medicalSpecialtyId: specialty.id,
    goldStandardPath,
    examLatencies,
    baselineExamFindings,
    createdById: user.id,
  };

  const existing = await prisma.clinicalCase.findFirst({
    where: { title: CASE_TITLE, createdById: user.id },
    select: { id: true, nodes: { select: { id: true }, take: 1, orderBy: { order: "asc" } } },
  });

  let caseId: string;

  if (existing) {
    caseId = existing.id;
    await prisma.clinicalCase.update({
      where: { id: caseId },
      data: casePayload,
    });

    const firstNodeId = existing.nodes[0]?.id;
    if (firstNodeId) {
      await prisma.caseNode.update({
        where: { id: firstNodeId },
        data: {
          order: 1,
          type: "HISTORY",
          content: { casePrompt: PATIENT_PROMPT },
        },
      });
    } else {
      await prisma.caseNode.create({
        data: {
          caseId,
          order: 1,
          type: "HISTORY",
          content: { casePrompt: PATIENT_PROMPT },
        },
      });
    }
    console.log(`  Updated case: ${caseId}`);
  } else {
    const created = await prisma.clinicalCase.create({
      data: {
        ...casePayload,
        nodes: {
          create: [
            {
              order: 1,
              type: "HISTORY",
              content: { casePrompt: PATIENT_PROMPT },
            },
          ],
        },
      },
      select: { id: true },
    });
    caseId = created.id;
    console.log(`  Created case: ${caseId}`);
  }

  console.log("\n✓ Seed STEMI completato.");
  console.log(`  Play URL: /dashboard/prassi/play/${caseId}`);
  console.log(`  Budget SSN: €400 | Deterioramento: 15 min | Stress iniziale: 75`);
}

main()
  .catch((error) => {
    console.error("Seed STEMI failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
