/**
 * Fix gender–name inconsistencies in clinical case text / demographics.
 *
 * - If sex is F and text contains male given names (e.g. "Luca Rossi"), swap to female.
 * - If sex is M and text contains female given names, swap to male.
 * - Normalizes demographics.sex labels (Femmina/Maschio → F/M).
 *
 * Usage: npx tsx scripts/fix-gender-name-consistency.ts
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

/** Male → female replacements when patient sex is F. */
const MALE_NAME_SWAPS: Array<[RegExp, string]> = [
  [/\bLuca Rossi\b/gi, "Lucia Rossi"],
  [/\bMarco Rossi\b/gi, "Laura Rossi"],
  [/\bLuca\b/gi, "Lucia"],
  [/\bMarco\b/gi, "Laura"],
  [/\bPaolo\b/gi, "Paola"],
  [/\bDavide\b/gi, "Chiara"],
  [/\bGiovanni\b/gi, "Giovanna"],
  [/\bAlessandro\b/gi, "Alessandra"],
  [/\bMatteo\b/gi, "Matilde"],
];

/** Female → male replacements when patient sex is M. */
const FEMALE_NAME_SWAPS: Array<[RegExp, string]> = [
  [/\bLucia Rossi\b/gi, "Marco Rossi"],
  [/\bLaura Rossi\b/gi, "Marco Rossi"],
  [/\bLucia\b/gi, "Luca"],
  [/\bLaura\b/gi, "Marco"],
  [/\bGiulia\b/gi, "Giulio"],
  [/\bElena\b/gi, "Enrico"],
  [/\bChiara\b/gi, "Carlo"],
  [/\bFrancesca\b/gi, "Francesco"],
  [/\bAnna\b/gi, "Antonio"],
  [/\bPaola\b/gi, "Paolo"],
  [/\bGiovanna\b/gi, "Giovanni"],
  [/\bAlessandra\b/gi, "Alessandro"],
  [/\bMatilde\b/gi, "Matteo"],
];

const MALE_NAME_RE =
  /\b(Luca Rossi|Marco Rossi|Luca|Marco|Paolo|Davide|Giovanni|Alessandro|Matteo)\b/i;
const FEMALE_NAME_RE =
  /\b(Lucia Rossi|Laura Rossi|Lucia|Laura|Giulia|Elena|Chiara|Francesca|Anna|Paola|Giovanna|Alessandra|Matilde)\b/i;

function normalizeSex(raw: unknown): "M" | "F" | null {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  if (["M", "MALE", "MASCHIO", "MASCHILE", "UOMO"].includes(s)) return "M";
  if (["F", "FEMALE", "FEMMINA", "FEMMINILE", "DONNA"].includes(s)) return "F";
  return null;
}

function applySwaps(text: string, swaps: Array<[RegExp, string]>): string {
  let out = text;
  for (const [re, replacement] of swaps) {
    out = out.replace(re, replacement);
  }
  return out;
}

function fixTextForSex(text: string, sex: "M" | "F"): string {
  return sex === "F" ? applySwaps(text, MALE_NAME_SWAPS) : applySwaps(text, FEMALE_NAME_SWAPS);
}

function hasMismatch(text: string, sex: "M" | "F"): boolean {
  return sex === "F" ? MALE_NAME_RE.test(text) : FEMALE_NAME_RE.test(text);
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set. Configure .env.local before running.");
  }

  const prisma = new PrismaClient();
  let updated = 0;

  try {
    const cases = await prisma.clinicalCase.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        baselineExamFindings: true,
        nodes: { select: { id: true, content: true } },
      },
    });

    for (const clinicalCase of cases) {
      const baseline = (clinicalCase.baselineExamFindings ?? {}) as Record<string, unknown>;
      const demographics = (baseline.demographics ?? {}) as Record<string, unknown>;
      const sex = normalizeSex(demographics.sex);
      if (!sex) continue;

      let dirty = false;
      let nextTitle = clinicalCase.title;
      let nextDescription = clinicalCase.description;
      const nextBaseline = { ...baseline, demographics: { ...demographics, sex } };

      if (demographics.sex !== sex) dirty = true;

      if (hasMismatch(nextTitle, sex)) {
        nextTitle = fixTextForSex(nextTitle, sex);
        dirty = true;
      }
      if (hasMismatch(nextDescription, sex)) {
        nextDescription = fixTextForSex(nextDescription, sex);
        dirty = true;
      }

      const nodeUpdates: Array<{ id: string; content: unknown }> = [];
      for (const node of clinicalCase.nodes) {
        const content = node.content;
        if (!content || typeof content !== "object" || Array.isArray(content)) continue;
        const c = { ...(content as Record<string, unknown>) };
        let nodeDirty = false;
        for (const key of ["casePrompt", "patientPrompt", "prompt"] as const) {
          const val = c[key];
          if (typeof val === "string" && hasMismatch(val, sex)) {
            c[key] = fixTextForSex(val, sex);
            nodeDirty = true;
          }
        }
        if (nodeDirty) {
          nodeUpdates.push({ id: node.id, content: c });
          dirty = true;
        }
      }

      if (!dirty) continue;

      await prisma.$transaction(async (tx) => {
        await tx.clinicalCase.update({
          where: { id: clinicalCase.id },
          data: {
            title: nextTitle,
            description: nextDescription,
            baselineExamFindings: nextBaseline,
          },
        });
        for (const n of nodeUpdates) {
          await tx.caseNode.update({
            where: { id: n.id },
            data: { content: n.content as object },
          });
        }
      });

      updated += 1;
      console.log(`Fixed case ${clinicalCase.id}: sex=${sex} title="${nextTitle}"`);
    }

    console.log(`Done. Updated ${updated} case(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
