/** Deterministic demo vitals / display names for immersive Prassi UI (not clinical truth). */

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type DemoVitals = {
  bp: string;
  hr: number;
  spo2: number;
  temp: string;
  rr: number;
};

export function deriveDemoVitals(caseId: string, stress = 0): DemoVitals {
  const seed = hashSeed(caseId || "demo");
  const stressClamped = Math.max(0, Math.min(100, stress));
  const stressFactor = stressClamped / 100;

  const systolic = Math.round(110 + (seed % 25) + stressFactor * 28);
  const diastolic = Math.round(68 + (seed % 18) + stressFactor * 12);
  const hr = Math.round(62 + (seed % 28) + stressFactor * 42);
  const spo2 = Math.max(82, Math.round(97 - (seed % 3) - stressFactor * 12));
  const temp = (36.1 + ((seed % 12) / 10) + stressFactor * 0.6).toFixed(1);
  const rr = Math.round(14 + (seed % 7) + stressFactor * 10);

  return {
    bp: `${systolic}/${diastolic}`,
    hr,
    spo2,
    temp,
    rr,
  };
}

const MALE_NAMES = ["Marco Bianchi", "Luca Rossi", "Andrea Conti", "Paolo Ricci", "Davide Greco"];
const FEMALE_NAMES = ["Giulia Romano", "Sara Esposito", "Elena Marino", "Chiara Costa", "Francesca Gallo"];

export function patientDisplayName(caseId: string, title?: string | null): string {
  const seed = hashSeed(caseId || "demo");
  const titleLower = (title ?? "").toLowerCase();
  const femaleHint =
    titleLower.includes("donna") ||
    titleLower.includes("paziente f") ||
    titleLower.includes(" gravid");
  const pool = femaleHint ? FEMALE_NAMES : MALE_NAMES;
  return pool[seed % pool.length];
}

export function estimateAgeFromTitle(title?: string | null, fallback = 58): number {
  if (!title) return fallback;
  const match = title.match(/(\d{1,3})\s*anni?/i);
  if (match) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 110) return n;
  }
  return fallback;
}
