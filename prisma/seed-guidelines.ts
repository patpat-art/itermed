/**
 * Seed initial medical-legal guideline documents for /dashboard/guidelines.
 *
 * Idempotent upsert by exact title. Does not require Pinecone (Postgres corpus only);
 * chunkCount is computed from local text chunking for UI display.
 *
 * Run (from `itermed/`):
 *   npx tsx prisma/seed-guidelines.ts
 *   npm run db:seed:guidelines
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;

type SeedGuideline = {
  title: string;
  tags: string[];
  sourceType: string;
  sourceName: string;
  /** Specialty name to attach, or null for transversal corpus. */
  specialtyName: string | null;
  text: string;
};

function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    let chunk = normalized.slice(start, end);
    if (end < normalized.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      if (lastPeriod > CHUNK_SIZE * 0.6) {
        chunk = chunk.slice(0, lastPeriod + 1);
      }
    }
    const trimmed = chunk.trim();
    if (trimmed) chunks.push(trimmed);
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
    if (start >= end) start = end;
  }
  return chunks;
}

const GUIDELINES: SeedGuideline[] = [
  {
    title: "Legge Gelli-Bianco (L. 24/2017) — Responsabilità professionale",
    tags: ["legale", "gelli-bianco", "responsabilità", "trasversale"],
    sourceType: "TEXT",
    sourceName: "Normativa IT — seed AEQUAN",
    specialtyName: null,
    text: `
LEGGE 8 marzo 2017, n. 24 (Gelli-Bianco) — Sintesi operativa per simulazione clinico-medico-legale.

Art. 5 — Buone pratiche clinico-assistenziali e raccomandazioni previste dalle linee guida.
Il professionista sanitario, nell'esecuzione delle prestazioni, si attiene, salve le specificità del caso concreto, alle raccomandazioni previste dalle linee guida elaborate da enti e istituzioni pubblici e privati nonché dalle società scientifiche e dalle associazioni tecnico-scientifiche delle professioni sanitarie iscritte in apposito elenco. In mancanza di dette raccomandazioni, si attiene alle buone pratiche clinico-assistenziali.

Implicazioni formative:
1) Documentare il percorso decisionale e il confronto con linee guida SNLG / società scientifiche.
2) Motivare eventuali scostamenti giustificati dal caso concreto (comorbidità, risorse, urgenza).
3) Conservare evidenza di informazione al paziente e, ove richiesto, di consenso informato.

Art. 7 — Responsabilità civile della struttura e del professionista.
La struttura sanitaria o sociosanitaria pubblica o privata che, nell'adempimento della propria obbligazione, si avvale dell'opera di esercenti la professione sanitaria, anche se scelti dal paziente e non dipendenti della struttura, risponde delle loro condotte dolose o colpose.

Checklist medico-legale in PS / area critica:
- Anamnesi farmacologica e allergie indagate e registrate.
- Consenso informato quando applicabile (procedure invasive, rischi rilevanti).
- Tracciabilità temporale di ECG, esami critici e decisioni di dimissione/ricovero.
- Indicazioni di follow-up e red flags al paziente/caregiver.
- Cartella clinica completa, leggibile e non contraddittoria.

Red flags di esposizione legale:
- Omissione di red flag cliniche senza motivazione.
- Mancata documentazione di consenso o di rifiuto informato.
- Percorso diagnostico caotico non confrontabile con gold standard.
- Dimissione precoce senza piano di sorveglianza.
`.trim(),
  },
  {
    title: "Consenso informato e documentazione clinica — Standard operativo",
    tags: ["legale", "consenso", "documentazione", "trasversale"],
    sourceType: "TEXT",
    sourceName: "Protocollo formativo AEQUAN",
    specialtyName: null,
    text: `
CONSENSO INFORMATO E DOCUMENTAZIONE — Standard formativo AEQUAN.

Elementi minimi del consenso (quando richiesto):
- Natura e scopo della prestazione / procedura.
- Benefici attesi e alternative ragionevoli.
- Rischi tipici, anche se non frequenti ma gravi.
- Conseguenze del rifiuto o del differimento.
- Spazio per domande e verifica di comprensione.

Documentazione minima in cartella:
- Motivo di accesso e cronologia dei sintomi.
- Anamnesi prossima/remota, terapie domiciliari, allergie.
- Esame obiettivo mirato con parametri vitali.
- Ipotesi diagnostiche e piano (esami/terapie) con razionale.
- Esito degli esami e impatto sulle decisioni.
- Diagnosi finale / ipotesi di lavoro e disposition (dimissione, ricovero, trasferimento).
- Istruzioni di dimissione, follow-up e criteri di rientro.

Buone pratiche:
- Usare linguaggio tecnico ma comprensibile nelle comunicazioni al paziente.
- Evitare affermazioni non verificabili rispetto ai dati in cartella.
- Aggiornare la cartella in tempo reale durante la simulazione clinica.
`.trim(),
  },
  {
    title: "Linee Guida ESC 2023 — Sindromi Coronariche Acute (sintesi operativa)",
    tags: ["cardiologia", "esc", "sca", "stemi", "nstemi"],
    sourceType: "TEXT",
    sourceName: "ESC / sintesi formativa AEQUAN",
    specialtyName: "Cardiologia",
    text: `
ESC 2023 — SINDROMI CORONARICHE ACUTE — Sintesi operativa per simulazione.

Valutazione iniziale:
- Dolore toracico suggestivo: ECG entro 10 minuti dall'arrivo; ripetere se sintomi persistenti o evolutivi.
- Stratificazione immediata STEMI vs NSTE-ACS.
- Troponina ad alta sensibilità secondo protocollo 0/1h o 0/2h dove disponibile.

STEMI:
- Riconoscimento ECG e attivazione precoce della rete IMA.
- Riperfusione primaria preferita; tempi porta-pallone da minimizzare.
- Doppia antiaggregazione e anticoagulazione secondo protocollo locale, valutando controindicazioni/sanguinamento.

NSTE-ACS:
- Stratificazione di rischio (GRACE e analoghi clinici).
- Monitoraggio, terapia antitrombotica e timing di coronarografia basato sul rischio.
- Evitare imaging non modificante la gestione acuta se ECG/troponina sono già dirimenti.

Sicurezza e appropriatezza:
- Non omettere anamnesi di allergie e terapie antiaggreganti/anticoagulanti.
- Documentare timing ECG/troponina e decisioni di trasferimento.
- Limitare esami ridondanti (es. RX torace di routine se non cambia management).
`.trim(),
  },
  {
    title: "Protocollo PS — Dolore toracico (percorso fast-track)",
    tags: ["emergenza", "dolore-toracico", "ps", "fast-track"],
    sourceType: "TEXT",
    sourceName: "Protocollo formativo Regione-like AEQUAN",
    specialtyName: "Medicina d'Emergenza-Urgenza",
    text: `
PROTOCOLLO PS — DOLORE TORACICO (FAST-TRACK) — Sintesi operativa.

Triage e accesso:
- Identificazione precoce dolore toracico / equivalenti ischemici.
- Posizionamento in area monitorata; accesso venoso; monitoraggio continuo.
- ECG entro 10 minuti; ripetizione se dolore persistente.

Work-up minimo:
- Anamnesi mirata: caratteristiche dolore, irradiazione, dispnea, sudorazione, fattori di rischio CV, terapie, allergie.
- Troponina hs secondo algoritmo temporale del centro.
- Valutazione differenziale: SCA, dissezione, EP, pneumotorace, cause muscolo-scheletriche.

Decisioni:
- STEMI → attivazione rete IMA.
- NSTE-ACS ad alto rischio → ricovero / consulenza cardio e timing invasivo.
- Basso rischio con work-up negativo → dimissione con follow-up e red flags esplicitate.

Appropriatezza:
- Evitare panel di imaging non indicato se ECG e troponina guidano già la gestione.
- Documentare ogni omissione consapevole rispetto al percorso gold standard.
`.trim(),
  },
  {
    title: "Surviving Sepsis Campaign — Bundle iniziale (sintesi)",
    tags: ["infettivologia", "sepsi", "emergenza", "bundle"],
    sourceType: "TEXT",
    sourceName: "SSC / sintesi formativa AEQUAN",
    specialtyName: "Malattie Infettive",
    text: `
SURVIVING SEPSIS — BUNDLE INIZIALE — Sintesi operativa.

Riconoscimento:
- Sospetto sepsi/shock settico: infezione + disfunzione d'organo / ipotensione / lattati elevati.
- Non ritardare la terapia per attendere esami non essenziali.

Bundle ora-1 (principi):
- Misurare lattati e ripetere se elevati.
- Emocolture prima degli antibiotici quando possibile senza ritardare.
- Antibiotici ad ampio spettro tempestivi.
- Fluidi cristalloidi in ipotensione / ipoperfusione secondo protocollo.
- Vasopressori se shock persistente dopo riempimento adeguato (noradrenalina di prima linea).

Documentazione medico-legale:
- Orario di riconoscimento, antibiotic start, fluidi e risposta pressoria.
- Fonte sospetta e piano di source control.
- Rivalutazione continua e criteri di escalation.
`.trim(),
  },
  {
    title: "Stroke acuto — Percorso tempo-dipendente (sintesi ESO/AAN)",
    tags: ["neurologia", "ictus", "stroke", "tempo-dipendente"],
    sourceType: "TEXT",
    sourceName: "ESO/AAN sintesi formativa AEQUAN",
    specialtyName: "Neurologia",
    text: `
STROKE ACUTO — PERCORSO TEMPO-DIPENDENTE — Sintesi operativa.

Riconoscimento:
- Deficit focale improvviso (FAST/BE-FAST): faccia, arti, linguaggio, vista, equilibrio.
- Tempo di esordio (last known well) critico per trombolisi/trombectomia.

Azioni immediate:
- ABC e glicemia; non abbassare aggressivamente la PA in fase iperacuta senza indicazione.
- Imaging cerebrale urgente (TC/angio secondo protocollo stroke).
- Attivazione team stroke; non ritardare per esami non essenziali.

Sicurezza:
- Controindicazioni a trombolisi da indagare (chirurgia recente, sanguinamento, anticoagulanti).
- Documentare timeline: esordio → arrivo → imaging → decisione terapeutica.
`.trim(),
  },
  {
    title: "Appropriatezza prescrittiva ed economicità SSN — Principi formativi",
    tags: ["economia", "appropriatezza", "ssn", "esami"],
    sourceType: "TEXT",
    sourceName: "Protocollo formativo AEQUAN",
    specialtyName: null,
    text: `
APPROPRIATEZZA PRESCRITTIVA ED ECONOMICITÀ — Principi AEQUAN.

Regole:
1) Ogni esame deve modificare probabilità pre-test o management.
2) Preferire pathway evidence-based a panel difensivi.
3) Evitare duplicazioni di esami già disponibili.
4) Quantificare costi e motivare sprechi evitabili nel referto.

Esempi di inappropriatezza:
- Imaging avanzato senza red flag o senza work-up di base.
- Marker multipli ridondanti nella stessa finestra temporale.
- Terapie empiriche ad alto costo senza razionale clinico.

Documentazione:
- Elencare esami richiesti con indicazione clinica.
- Dichiarare esami considerati e non eseguiti per inappropriati.
- Collegare la spesa al budget target del caso simulato.
`.trim(),
  },
];

async function resolveSpecialtyId(name: string | null): Promise<string | null> {
  if (!name) return null;
  const row = await prisma.medicalSpecialty.findFirst({
    where: { name },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function upsertGuideline(seed: SeedGuideline): Promise<void> {
  const chunks = chunkText(seed.text);
  const specialtyId = await resolveSpecialtyId(seed.specialtyName);

  const existing = await prisma.guidelineDocument.findFirst({
    where: { title: seed.title },
    select: { id: true },
  });

  if (existing) {
    await prisma.guidelineDocument.update({
      where: { id: existing.id },
      data: {
        tags: seed.tags,
        sourceType: seed.sourceType,
        sourceName: seed.sourceName,
        text: seed.text,
        chunkCount: chunks.length,
        isActive: true,
        medicalSpecialtyId: specialtyId,
      },
    });
    console.log(`  ✓ updated: ${seed.title} (${chunks.length} chunks)`);
    return;
  }

  await prisma.guidelineDocument.create({
    data: {
      title: seed.title,
      tags: seed.tags,
      sourceType: seed.sourceType,
      sourceName: seed.sourceName,
      text: seed.text,
      chunkCount: chunks.length,
      isActive: true,
      medicalSpecialtyId: specialtyId,
    },
  });
  console.log(`  ✓ created: ${seed.title} (${chunks.length} chunks)`);
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("→ Seeding guideline documents…");
  for (const g of GUIDELINES) {
    await upsertGuideline(g);
  }

  const total = await prisma.guidelineDocument.count({ where: { isActive: true } });
  console.log(`Done. Active guideline documents: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
