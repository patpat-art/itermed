export type ExamClinicalMeta = {
  price: number;
  urgencyTiming: string;
  routineTiming: string;
  routineMinutes: number;
  normalFinding: string;
};

export const EXAM_DEFAULT_VALUES: Record<string, ExamClinicalMeta> = {
  "lattati": { price: 5, urgencyTiming: "15 min", routineTiming: "1h", routineMinutes: 60, normalFinding: "0.5 – 2.2 mmol/L" },
  "ammoniemia": { price: 8.5, urgencyTiming: "45 min", routineTiming: "2h", routineMinutes: 120, normalFinding: "15 – 45 µg/dL" },
  "amilasi-lipasi": { price: 7, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "Amilasi <100 U/L; Lipasi <60 U/L" },
  "assetto-lipidico": { price: 12, urgencyTiming: "n.p.", routineTiming: "12h", routineMinutes: 720, normalFinding: "Tot <200; LDL <130; HDL >50 mg/dL" },
  "bilirubina": { price: 3.5, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "Totale 0.3 – 1.2 mg/dL" },
  "creat-urea-gfr": { price: 4.5, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "Creatinina 0.6-1.2 mg/dL; GFR >90" },
  "elettroliti": { price: 6.5, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "Na 135-145; K 3.5-5.0 mEq/L" },
  "protidogramma": { price: 8, urgencyTiming: "n.p.", routineTiming: "24-48h", routineMinutes: 1440, normalFinding: "Albumina 55-65%" },
  "hba1c": { price: 10.5, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "< 39 mmol/mol (o < 5.7%)" },
  "glicemia": { price: 2.1, urgencyTiming: "15 min", routineTiming: "4h", routineMinutes: 240, normalFinding: "70 – 100 mg/dL" },
  "enzimi-epatici": { price: 10, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "AST/ALT <40 U/L; GGT <50 U/L" },
  "ldh": { price: 3, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "135 – 225 U/L" },
  "mioglobina": { price: 15, urgencyTiming: "45 min", routineTiming: "2h", routineMinutes: 120, normalFinding: "< 80 ng/mL" },
  "nt-probnp": { price: 35, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "< 125 pg/mL" },
  "pcr-pct": { price: 28, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "PCR <0.5 mg/dL; PCT <0.05 ng/mL" },
  "troponina-hs": { price: 18, urgencyTiming: "45 min", routineTiming: "2h", routineMinutes: 120, normalFinding: "< 14 ng/L" },
  "uricemia": { price: 3, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "2.5 – 7.0 mg/dL" },
  "vitamine": { price: 45, urgencyTiming: "n.p.", routineTiming: "3-5 gg", routineMinutes: 4320, normalFinding: "Vit D 30-100 ng/mL" },
  "antitrombina": { price: 12, urgencyTiming: "2h", routineTiming: "12h", routineMinutes: 720, normalFinding: "80% – 120%" },
  "ddimero": { price: 16, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "< 500 ng/mL" },
  "emocromo": { price: 4.8, urgencyTiming: "20 min", routineTiming: "4h", routineMinutes: 240, normalFinding: "Hb 13-17 (M) / 12-15 (F) g/dL" },
};
