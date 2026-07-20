import { normalizeStepId } from "@/lib/cases/simulation-time";

export type CanonicalExam = {
  canonicalKey: string;
  label: string;
  milestoneKey: string;
  invasive: boolean;
  aliases: string[];
};

/** Normalizes free text for fuzzy exam matching (accents, punctuation). */
export function normalizeExamText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CANONICAL_EXAMS: CanonicalExam[] = [
  {
    canonicalKey: "tc_encefalo",
    label: "TC/TAC encefalo",
    milestoneKey: "richiesto_tc_encefalo",
    invasive: false,
    aliases: [
      "tc encefalo",
      "tac encefalo",
      "tc cranio",
      "tac cranio",
      "tc cerebrale",
      "tac cerebrale",
      "tc cerebro",
      "tac cerebro",
      "tomografia computerizzata encefalo",
      "tomografia cranio",
      "tc testa",
      "tac testa",
      "rm encefalo",
    ],
  },
  {
    canonicalKey: "tc_torace",
    label: "TC/TAC torace",
    milestoneKey: "richiesto_tc_torace",
    invasive: false,
    aliases: ["tc torace", "tac torace", "tc polmoni", "tac polmoni", "tc toracica"],
  },
  {
    canonicalKey: "rx_torace",
    label: "RX torace",
    milestoneKey: "richiesto_rx_torace",
    invasive: false,
    aliases: ["rx torace", "radiografia torace", "rx toracica", "rx polmoni"],
  },
  {
    canonicalKey: "ecg",
    label: "ECG / Elettrocardiogramma",
    milestoneKey: "richiesto_ecg",
    invasive: false,
    aliases: ["ecg", "elettrocardiogramma", "elettrocardiografia"],
  },
  {
    canonicalKey: "emocromo",
    label: "Emocromo",
    milestoneKey: "richiesto_emocromo",
    invasive: false,
    aliases: ["emocromo", "cbc", "formula ematica"],
  },
  {
    canonicalKey: "emogas",
    label: "Emogasanalisi",
    milestoneKey: "richiesto_emogas",
    invasive: true,
    aliases: ["emogas", "gas arterioso", "abg", "emogasanalisi", "gas ematico"],
  },
  {
    canonicalKey: "troponina",
    label: "Troponina",
    milestoneKey: "richiesto_troponina",
    invasive: false,
    aliases: ["troponina", "troponina i", "troponina t"],
  },
  {
    canonicalKey: "ddimero",
    label: "D-dimero",
    milestoneKey: "richiesto_ddimero",
    invasive: false,
    aliases: ["d dimero", "ddimero", "d-dimero"],
  },
  {
    canonicalKey: "tc_addome",
    label: "TC/TAC addome",
    milestoneKey: "richiesto_tc_addome",
    invasive: false,
    aliases: ["tc addome", "tac addome", "tc addominale", "tac addominale"],
  },
  {
    canonicalKey: "cateterismo",
    label: "Cateterismo / coronarografia",
    milestoneKey: "richiesto_cateterismo",
    invasive: true,
    aliases: ["cateterismo", "coronarografia", "angiografia coronarica", "cate"],
  },
  {
    canonicalKey: "tc_generica",
    label: "TC/TAC",
    milestoneKey: "richiesto_tc",
    invasive: false,
    aliases: ["tc", "tac", "tomografia computerizzata"],
  },
];

const aliasIndex = new Map<string, CanonicalExam>();

for (const exam of CANONICAL_EXAMS) {
  for (const alias of [exam.canonicalKey, exam.label, ...exam.aliases]) {
    aliasIndex.set(normalizeExamText(alias), exam);
  }
  aliasIndex.set(normalizeStepId(exam.canonicalKey), exam);
}

/**
 * Resolves exam id, catalog name, or free-text prescription to a canonical exam entry.
 * More specific keys (tc_encefalo) win over generic (tc) via longest normalized match.
 */
export function resolveCanonicalExam(
  examIdOrLabel: string,
  catalogName?: string,
): CanonicalExam | null {
  const candidates = [examIdOrLabel, catalogName].filter(Boolean) as string[];
  let best: { exam: CanonicalExam; score: number } | null = null;

  for (const raw of candidates) {
    const norm = normalizeExamText(raw);
    const step = normalizeStepId(raw);

    const direct = aliasIndex.get(norm) ?? aliasIndex.get(step);
    if (direct) {
      const score = norm.length;
      if (!best || score > best.score) best = { exam: direct, score };
    }

    for (const [alias, exam] of aliasIndex.entries()) {
      if (alias.length < 3) continue;
      if (norm.includes(alias) || alias.includes(norm)) {
        const score = alias.length;
        if (!best || score > best.score) best = { exam, score };
      }
    }
  }

  return best?.exam ?? null;
}

export function buildPrescribedExamsManifest(
  exams: Array<{ id: string; name: string }>,
): string {
  const lines = exams.map((e) => {
    const canon = resolveCanonicalExam(e.id, e.name);
    return `- [${e.id}] ${e.name}${canon ? ` → canonico: ${canon.label} (${canon.milestoneKey})` : ""}`;
  });
  return lines.join("\n") || "Nessun esame prescritto.";
}

export function examMatchesCanonical(haystack: string, canonical: CanonicalExam): boolean {
  const norm = normalizeExamText(haystack);
  if (norm.includes(normalizeExamText(canonical.label))) return true;
  return canonical.aliases.some((a) => {
    const alias = normalizeExamText(a);
    return alias.length >= 3 && (norm.includes(alias) || alias.includes(norm));
  });
}

export function isInvasiveExam(examId: string, examName?: string): boolean {
  const canon = resolveCanonicalExam(examId, examName);
  return canon?.invasive ?? false;
}
