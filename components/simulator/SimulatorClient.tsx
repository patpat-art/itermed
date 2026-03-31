"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  FlaskConical,
  Clock,
  EuroIcon,
  HeartPulse,
  Microscope,
  ScanLine,
  Search,
  Sparkles,
  FolderOpen,
  TestTube2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../app/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../app/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../app/ui/card";
import { Button } from "../../app/ui/button";
import { Textarea } from "../../app/ui/textarea";
import { Badge } from "../../app/ui/badge";
import { PhysicalExamTab } from "./PhysicalExamTab";

type Exam = {
  id: string;
  name: string;
  cost: number;
  timeMinutes: number;
  urgencyTiming?: string;
  routineTiming?: string;
  normalFinding?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ExamGroup = { id: string; label: string; exams: Exam[] };
type ExamMacroCategory = { id: string; label: string; groups: ExamGroup[] };

type ExamClinicalMeta = {
  price: number;
  urgencyTiming: string;
  routineTiming: string;
  routineMinutes: number;
  normalFinding: string;
};

const EXAM_META: Record<string, ExamClinicalMeta> = {
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
  "assetto-marziale": { price: 14, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Ferritina 30 – 300 ng/mL" },
  "fibrinogeno": { price: 6.5, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "200 – 400 mg/dL" },
  "gruppo-rh": { price: 18, urgencyTiming: "30 min", routineTiming: "4h", routineMinutes: 240, normalFinding: "Esempio: 0 Positivo" },
  "pt-ptt-inr": { price: 8.5, urgencyTiming: "45 min", routineTiming: "4h", routineMinutes: 240, normalFinding: "INR 0.8 – 1.2" },
  "reticolociti": { price: 5, urgencyTiming: "2h", routineTiming: "12h", routineMinutes: 720, normalFinding: "0.5% – 2.0%" },
  "ves": { price: 3.5, urgencyTiming: "n.p.", routineTiming: "2h", routineMinutes: 120, normalFinding: "<15 mm/h (M) / <20 mm/h (F)" },
  "acth-cortisolo": { price: 32, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "Cortisolo (8:00): 5 – 25 µg/dL" },
  "aldosterone-renina": { price: 48, urgencyTiming: "n.p.", routineTiming: "7 gg", routineMinutes: 10080, normalFinding: "Rapporto ARR < 20-30" },
  "beta-hcg": { price: 15, urgencyTiming: "2h", routineTiming: "6h", routineMinutes: 360, normalFinding: "< 5 mUI/mL (Negativo)" },
  "catecolamine": { price: 45, urgencyTiming: "n.p.", routineTiming: "10 gg", routineMinutes: 14400, normalFinding: "Adrenalina ur. < 20 µg/24h" },
  "fsh-lh-prl": { price: 28, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Prolattina 5 – 20 ng/mL" },
  "insulina-cpep": { price: 22, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Insulina 3 – 25 µUI/mL" },
  "gh-igf1": { price: 35, urgencyTiming: "n.p.", routineTiming: "5 gg", routineMinutes: 7200, normalFinding: "GH < 5 ng/mL" },
  "tiroide": { price: 22, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "TSH 0.4 – 4.0 µUI/mL" },
  "pth": { price: 18, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "10 – 65 pg/mL" },
  "ormoni-sessuali": { price: 38, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Variabile per sesso/ciclo" },
  "hiv-hcv-hbv": { price: 35, urgencyTiming: "4h", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Assente (Negativo)" },
  "anca": { price: 32, urgencyTiming: "n.p.", routineTiming: "5-7 gg", routineMinutes: 7200, normalFinding: "Negativo" },
  "anti-ccp": { price: 18, urgencyTiming: "n.p.", routineTiming: "5-7 gg", routineMinutes: 7200, normalFinding: "< 20 U/mL (Negativo)" },
  "anti-dna": { price: 15, urgencyTiming: "n.p.", routineTiming: "5-7 gg", routineMinutes: 7200, normalFinding: "Negativo" },
  "ana-ena": { price: 45, urgencyTiming: "n.p.", routineTiming: "5-7 gg", routineMinutes: 7200, normalFinding: "Negativo / Titolo < 1:80" },
  "c3-c4": { price: 14, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "C3 90-180; C4 10-40 mg/dL" },
  "fr": { price: 8, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "< 14 UI/mL" },
  "immunoglobuline": { price: 28, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "IgG 700 – 1600 mg/dL" },
  "torch": { price: 55, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "Assenza di IgM specifiche" },
  "quantiferon": { price: 60, urgencyTiming: "n.p.", routineTiming: "4 gg", routineMinutes: 5760, normalFinding: "Negativo" },
  "sifilide": { price: 12, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Negativo / Non reattivo" },
  "coprocultura": { price: 25, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "Negativo" },
  "emocolture": { price: 45, urgencyTiming: "24h", routineTiming: "5 gg", routineMinutes: 7200, normalFinding: "Negativo" },
  "urine-sed": { price: 6, urgencyTiming: "1h", routineTiming: "4h", routineMinutes: 240, normalFinding: "pH 6; Nitriti/Glucosio assenti" },
  "cdiff": { price: 30, urgencyTiming: "4h", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Negativo" },
  "tox-screen": { price: 40, urgencyTiming: "2h", routineTiming: "12h", routineMinutes: 720, normalFinding: "Negativo" },
  "tamponi": { price: 18, urgencyTiming: "n.p.", routineTiming: "48-72h", routineMinutes: 2880, normalFinding: "Flora saprofita normale" },
  "urinocoltura": { price: 20, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "< 10^5 CFU/mL" },
  "afp": { price: 15, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "< 10 ng/mL" },
  "beta-hcg-onco": { price: 15, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "< 5 mUI/mL" },
  "ca-markers": { price: 45, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "< 35 U/mL" },
  "cea": { price: 15, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "< 3.0 ng/mL (non fumatori)" },
  "calcitonina": { price: 20, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "< 10 pg/mL" },
  "nse": { price: 20, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "< 12 ng/mL" },
  "psa": { price: 18, urgencyTiming: "n.p.", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Totale < 4.0 ng/mL" },
  "ecocolordoppler": { price: 65, urgencyTiming: "Immediato", routineTiming: "n.p.", routineMinutes: 35, normalFinding: "Vasi pervi, flusso regolare" },
  "ecografia": { price: 55, urgencyTiming: "30 min", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Organi nei limiti per morfologia" },
  "fast": { price: 40, urgencyTiming: "5 min", routineTiming: "n.p.", routineMinutes: 15, normalFinding: "Assenza di versamento libero" },
  "mammografia": { price: 62, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "Assenza di lesioni sospette" },
  "moc": { price: 52, urgencyTiming: "n.p.", routineTiming: "2 gg", routineMinutes: 2880, normalFinding: "T-score > -1.0" },
  "rx-addome": { price: 25, urgencyTiming: "30 min", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Assenza di aria libera/livelli" },
  "rx-ossa": { price: 30, urgencyTiming: "30 min", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Assenza di fratture recenti" },
  "rx-colonna": { price: 35, urgencyTiming: "30 min", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Rachide in asse" },
  "rx-torace": { price: 25, urgencyTiming: "30 min", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Parenchima polmonare libero" },
  "angio": { price: 350, urgencyTiming: "2h", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Arterie di calibro regolare" },
  "colangio-rm": { price: 250, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Vie biliari non dilatate" },
  "pet-tc": { price: 950, urgencyTiming: "n.p.", routineTiming: "5 gg", routineMinutes: 7200, normalFinding: "Assenza di iperaccumuli patologici" },
  "rm": { price: 220, urgencyTiming: "2h", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Segnale parenchimale regolare" },
  "rm-prostata": { price: 280, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "PIRADS 1 o 2" },
  "scintigrafia": { price: 250, urgencyTiming: "n.p.", routineTiming: "3 gg", routineMinutes: 4320, normalFinding: "Captazione omogenea" },
  "tc": { price: 120, urgencyTiming: "1h", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Assenza aree alterata densità" },
  "uro-tc": { price: 180, urgencyTiming: "1h", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Regolare escrezione del mdc" },
  "audiometria": { price: 15, urgencyTiming: "30 min", routineTiming: "n.p.", routineMinutes: 30, normalFinding: "Udito nei limiti di norma" },
  "coronarografia": { price: 1800, urgencyTiming: "Real-time", routineTiming: "n.p.", routineMinutes: 120, normalFinding: "Albero coronarico indenne" },
  "ecocardio": { price: 75, urgencyTiming: "1h", routineTiming: "24h", routineMinutes: 1440, normalFinding: "EF > 55%; valvole competenti" },
  "ecg": { price: 15, urgencyTiming: "10 min", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Ritmo sinusale, no aritmie" },
  "emg": { price: 70, urgencyTiming: "n.p.", routineTiming: "48h", routineMinutes: 2880, normalFinding: "Conduzione nervosa normale" },
  "ega": { price: 10, urgencyTiming: "5-10 min", routineTiming: "n.p.", routineMinutes: 10, normalFinding: "pH 7.4; pO2 >80; pCO2 40 mmHg" },
  "abpm": { price: 45, urgencyTiming: "24h", routineTiming: "n.p.", routineMinutes: 1440, normalFinding: "Media pressoria < 130/80" },
  "spirometria": { price: 25, urgencyTiming: "30 min", routineTiming: "n.p.", routineMinutes: 30, normalFinding: "Rapporto Tiffeneau > 70%" },
  "broncoscopia": { price: 280, urgencyTiming: "1h", routineTiming: "7 gg", routineMinutes: 10080, normalFinding: "Mucose bronchiali indenni" },
  "cistoscopia": { price: 160, urgencyTiming: "1h", routineTiming: "24h", routineMinutes: 1440, normalFinding: "Pareti vescicali regolari" },
  "colonscopia": { price: 180, urgencyTiming: "1h", routineTiming: "7 gg", routineMinutes: 10080, normalFinding: "Mucosa del colon integra" },
  "egds": { price: 140, urgencyTiming: "1h", routineTiming: "7 gg", routineMinutes: 10080, normalFinding: "Esofago e stomaco regolari" },
  "liquidi": { price: 60, urgencyTiming: "2h", routineTiming: "5 gg", routineMinutes: 7200, normalFinding: "Assenza di atipie e batteri" },
  "pap-test": { price: 20, urgencyTiming: "n.p.", routineTiming: "15 gg", routineMinutes: 21600, normalFinding: "Negativo per cellule maligne" },
};

const withMeta = (exam: Exam): Exam => {
  const meta = EXAM_META[exam.id];
  if (!meta) return exam;
  return {
    ...exam,
    cost: meta.price,
    timeMinutes: meta.routineMinutes,
    urgencyTiming: meta.urgencyTiming,
    routineTiming: meta.routineTiming,
    normalFinding: meta.normalFinding,
  };
};

const RAW_EXAM_CATALOG: ExamMacroCategory[] = [
  {
    id: "lab",
    label: "Laboratorio",
    groups: [
      { id: "chimica", label: "Chimica Clinica e Indici di Flogosi", exams: [
        { id: "lattati", name: "Acido lattico (Lattati)", cost: 18, timeMinutes: 20 },
        { id: "ammoniemia", name: "Ammoniemia", cost: 20, timeMinutes: 25 },
        { id: "amilasi-lipasi", name: "Amilasemia e Lipasemia", cost: 24, timeMinutes: 25 },
        { id: "assetto-lipidico", name: "Assetto lipidico (Col Tot, HDL, LDL, TG)", cost: 22, timeMinutes: 20 },
        { id: "bilirubina", name: "Bilirubina (Totale e Frazionata)", cost: 16, timeMinutes: 20 },
        { id: "creat-urea-gfr", name: "Creatinina e Urea (Azotemia) con stima GFR", cost: 18, timeMinutes: 20 },
        { id: "elettroliti", name: "Elettroliti sierici (Na, K, Ca, Mg, Cl, P)", cost: 20, timeMinutes: 20 },
        { id: "protidogramma", name: "Elettroforesi proteica (Protidogramma)", cost: 28, timeMinutes: 35 },
        { id: "hba1c", name: "Emoglobina Glicata (HbA1c)", cost: 22, timeMinutes: 25 },
        { id: "glicemia", name: "Glicemia basale", cost: 12, timeMinutes: 15 },
        { id: "enzimi-epatici", name: "Indici di citolisi e colestasi (AST, ALT, GGT, FA)", cost: 24, timeMinutes: 25 },
        { id: "ldh", name: "Lattato deidrogenasi (LDH)", cost: 15, timeMinutes: 20 },
        { id: "mioglobina", name: "Mioglobina", cost: 25, timeMinutes: 25 },
        { id: "nt-probnp", name: "NT-proBNP (o BNP)", cost: 40, timeMinutes: 30 },
        { id: "pcr-pct", name: "Proteina C Reattiva (PCR) e Procalcitonina (PCT)", cost: 30, timeMinutes: 30 },
        { id: "troponina-hs", name: "Troponina (alta sensibilità)", cost: 35, timeMinutes: 25 },
        { id: "uricemia", name: "Uricemia", cost: 12, timeMinutes: 20 },
        { id: "vitamine", name: "Vitamine (D, B12, Folati)", cost: 38, timeMinutes: 35 },
      ]},
      { id: "ematologia", label: "Ematologia e Coagulazione", exams: [
        { id: "antitrombina", name: "Antitrombina III", cost: 32, timeMinutes: 35 },
        { id: "ddimero", name: "D-Dimero", cost: 28, timeMinutes: 25 },
        { id: "emocromo", name: "Emocromo completo con formula", cost: 14, timeMinutes: 20 },
        { id: "assetto-marziale", name: "Ferritina e assetto marziale", cost: 28, timeMinutes: 30 },
        { id: "fibrinogeno", name: "Fibrinogeno", cost: 20, timeMinutes: 25 },
        { id: "gruppo-rh", name: "Gruppo sanguigno e fattore Rh", cost: 20, timeMinutes: 20 },
        { id: "pt-ptt-inr", name: "Coagulazione (PT, PTT, INR)", cost: 22, timeMinutes: 20 },
        { id: "reticolociti", name: "Reticolociti", cost: 15, timeMinutes: 20 },
        { id: "ves", name: "VES", cost: 12, timeMinutes: 20 },
      ]},
      { id: "endocrino", label: "Endocrinologia e Marcatori", exams: [
        { id: "acth-cortisolo", name: "ACTH e Cortisolo", cost: 36, timeMinutes: 40 },
        { id: "aldosterone-renina", name: "Aldosterone e Renina (ARR)", cost: 38, timeMinutes: 40 },
        { id: "beta-hcg", name: "Beta-HCG (sierica/urinaria)", cost: 18, timeMinutes: 20 },
        { id: "catecolamine", name: "Catecolamine urinarie/plasmatiche", cost: 42, timeMinutes: 45 },
        { id: "fsh-lh-prl", name: "FSH, LH, Prolattina", cost: 26, timeMinutes: 30 },
        { id: "insulina-cpep", name: "Insulina e C-peptide", cost: 30, timeMinutes: 35 },
        { id: "gh-igf1", name: "GH e IGF-1", cost: 35, timeMinutes: 35 },
        { id: "tiroide", name: "Ormoni tiroidei (TSH, FT3, FT4)", cost: 25, timeMinutes: 25 },
        { id: "pth", name: "Paratormone (PTH)", cost: 24, timeMinutes: 25 },
        { id: "ormoni-sessuali", name: "Testosterone, Estradiolo, Progesterone", cost: 30, timeMinutes: 30 },
      ]},
      { id: "immuno", label: "Immunologia e Sierologia", exams: [
        { id: "hiv-hcv-hbv", name: "Ab anti HIV, HCV, HBV", cost: 30, timeMinutes: 30 },
        { id: "anca", name: "ANCA (p-ANCA e c-ANCA)", cost: 34, timeMinutes: 35 },
        { id: "anti-ccp", name: "Anti-CCP", cost: 30, timeMinutes: 35 },
        { id: "anti-dna", name: "Anti-DNA nativo", cost: 30, timeMinutes: 35 },
        { id: "ana-ena", name: "Autoanticorpi (ANA, ENA panel)", cost: 36, timeMinutes: 40 },
        { id: "c3-c4", name: "Complemento (C3, C4)", cost: 22, timeMinutes: 25 },
        { id: "fr", name: "Fattore Reumatoide", cost: 18, timeMinutes: 25 },
        { id: "immunoglobuline", name: "Immunoglobuline (IgA, IgG, IgM, IgE)", cost: 28, timeMinutes: 30 },
        { id: "torch", name: "Monotest e sierologia TORCH", cost: 38, timeMinutes: 40 },
        { id: "quantiferon", name: "Quantiferon", cost: 45, timeMinutes: 45 },
        { id: "sifilide", name: "Sifilide (VDRL, TPHA)", cost: 20, timeMinutes: 25 },
      ]},
      { id: "micro", label: "Microbiologia, Urine e Tossicologia", exams: [
        { id: "coprocultura", name: "Coprocultura e ricerca parassiti/uova", cost: 28, timeMinutes: 60 },
        { id: "emocolture", name: "Emocoltura (da due o più siti)", cost: 40, timeMinutes: 60 },
        { id: "urine-sed", name: "Esame urine chimico-fisico e sedimento", cost: 15, timeMinutes: 20 },
        { id: "cdiff", name: "Ricerca Tossina Clostridium Difficile", cost: 26, timeMinutes: 35 },
        { id: "tox-screen", name: "Screening tossicologico (urine/sangue)", cost: 35, timeMinutes: 30 },
        { id: "tamponi", name: "Specie microbiche da tampone", cost: 22, timeMinutes: 35 },
        { id: "urinocoltura", name: "Urinocoltura con antibiogramma", cost: 24, timeMinutes: 40 },
      ]},
      { id: "tumor", label: "Marcatori Tumorali", exams: [
        { id: "afp", name: "Alfa-fetoproteina (AFP)", cost: 24, timeMinutes: 30 },
        { id: "beta-hcg-onco", name: "Beta-HCG (marker oncologico)", cost: 20, timeMinutes: 25 },
        { id: "ca-markers", name: "CA 125, CA 15-3, CA 19-9", cost: 42, timeMinutes: 35 },
        { id: "cea", name: "CEA", cost: 22, timeMinutes: 30 },
        { id: "calcitonina", name: "Calcitonina", cost: 24, timeMinutes: 30 },
        { id: "nse", name: "Enolasi neurone-specifica (NSE)", cost: 26, timeMinutes: 30 },
        { id: "psa", name: "PSA (Totale, Libero e Ratio)", cost: 26, timeMinutes: 30 },
      ]},
    ],
  },
  {
    id: "img",
    label: "Immagini",
    groups: [
      { id: "rad-eco", label: "Radiologia Tradizionale ed Ecografia", exams: [
        { id: "ecocolordoppler", name: "Ecocolordoppler (TSA, venoso/arterioso arti, aorta)", cost: 90, timeMinutes: 35 },
        { id: "ecografia", name: "Ecografia (addome, tiroide, mammella, muscolotendinea, pelvica)", cost: 75, timeMinutes: 30 },
        { id: "fast", name: "Ecografia FAST", cost: 55, timeMinutes: 15 },
        { id: "mammografia", name: "Mammografia", cost: 80, timeMinutes: 25 },
        { id: "moc", name: "MOC (DEXA)", cost: 70, timeMinutes: 20 },
        { id: "rx-addome", name: "RX Addome (diretta)", cost: 35, timeMinutes: 20 },
        { id: "rx-ossa", name: "RX Articolazioni e segmenti ossei", cost: 35, timeMinutes: 20 },
        { id: "rx-colonna", name: "RX Colonna vertebrale", cost: 40, timeMinutes: 25 },
        { id: "rx-torace", name: "RX Torace (2 proiezioni)", cost: 35, timeMinutes: 20 },
      ]},
      { id: "avanzate", label: "Tecniche Avanzate (TC, RM, Medicina Nucleare)", exams: [
        { id: "angio", name: "Angio-TC e Angio-RM", cost: 220, timeMinutes: 80 },
        { id: "colangio-rm", name: "Colangio-RM", cost: 200, timeMinutes: 70 },
        { id: "pet-tc", name: "PET-TC", cost: 380, timeMinutes: 120 },
        { id: "rm", name: "RM Addome/Pelvi/Encefalo/Colonna/Articolare", cost: 230, timeMinutes: 90 },
        { id: "rm-prostata", name: "RM Prostatica Multiparametrica", cost: 260, timeMinutes: 95 },
        { id: "scintigrafia", name: "Scintigrafia (ossea/miocardica/polmonare/tiroidea)", cost: 260, timeMinutes: 110 },
        { id: "tc", name: "TC Addome/Encefalo/Torace/Rachide (con-senza mdc)", cost: 200, timeMinutes: 70 },
        { id: "uro-tc", name: "Uro-TC", cost: 220, timeMinutes: 80 },
      ]},
    ],
  },
  {
    id: "strum",
    label: "Strumentale",
    groups: [
      { id: "funzionale", label: "Diagnostica Strumentale e Funzionale", exams: [
        { id: "audiometria", name: "Audiometria", cost: 45, timeMinutes: 30 },
        { id: "coronarografia", name: "Coronarografia (Invasiva)", cost: 500, timeMinutes: 120 },
        { id: "ecocardio", name: "Ecocardiografia (Transtoracica/Transesofagea)", cost: 120, timeMinutes: 40 },
        { id: "ecg", name: "ECG (riposo/sforzo/Holter)", cost: 60, timeMinutes: 20 },
        { id: "eeg", name: "Elettroencefalogramma (EEG)", cost: 90, timeMinutes: 45 },
        { id: "emg", name: "Elettromiografia (EMG)", cost: 110, timeMinutes: 50 },
        { id: "ega", name: "Emogasanalisi arteriosa (EGA)", cost: 25, timeMinutes: 10 },
        { id: "fundus", name: "Fundus Oculi", cost: 60, timeMinutes: 20 },
        { id: "abpm", name: "Monitoraggio pressorio 24h (ABPM)", cost: 70, timeMinutes: 25 },
        { id: "oct", name: "OCT (Tomografia Ottica)", cost: 95, timeMinutes: 25 },
        { id: "polisonnografia", name: "Polisonnografia", cost: 180, timeMinutes: 480 },
        { id: "pot-evocati", name: "Potenziali Evocati", cost: 120, timeMinutes: 50 },
        { id: "spirometria", name: "Spirometria (semplice/globale)", cost: 65, timeMinutes: 25 },
        { id: "6mwt", name: "Test del cammino (6MWT)", cost: 35, timeMinutes: 20 },
      ]},
    ],
  },
  {
    id: "endo",
    label: "Endoscopia",
    groups: [
      { id: "endo-biopsie", label: "Endoscopia, Biopsie e Liquidi", exams: [
        { id: "fna", name: "Agoaspirato (FNA)", cost: 120, timeMinutes: 45 },
        { id: "biopsia", name: "Biopsia (osteomidollare o tissutale mirata)", cost: 180, timeMinutes: 60 },
        { id: "broncoscopia", name: "Broncoscopia (e BAL)", cost: 220, timeMinutes: 70 },
        { id: "cistoscopia", name: "Cistoscopia", cost: 180, timeMinutes: 50 },
        { id: "colonscopia", name: "Colonscopia", cost: 190, timeMinutes: 60 },
        { id: "egds", name: "Esofagogastroduodenoscopia (EGDS)", cost: 170, timeMinutes: 45 },
        { id: "laringoscopia", name: "Laringoscopia", cost: 95, timeMinutes: 30 },
        { id: "liquidi", name: "Liquidi biologici (liquor/pleurico/ascitico/sinoviale)", cost: 75, timeMinutes: 35 },
        { id: "pap-test", name: "Pap-test e Citologia", cost: 50, timeMinutes: 25 },
      ]},
    ],
  },
];

const EXAM_CATALOG: ExamMacroCategory[] = RAW_EXAM_CATALOG.map((macro) => ({
  ...macro,
  groups: macro.groups.map((group) => ({
    ...group,
    exams: group.exams.map(withMeta),
  })),
}));

const AVAILABLE_EXAMS: Exam[] = EXAM_CATALOG.flatMap((m) => m.groups.flatMap((g) => g.exams));

type InitialCaseData = {
  id: string;
  title: string;
  description: string;
  specialty: string | null;
  difficulty: string;
  estimatedDurationMinutes: number | null;
  patientPrompt: string;
  correctSolution?: string | null;
  demographics?: {
    age?: number | string | null;
    sex?: string | null;
    context?: string | null;
  };
};

type SimulatorClientProps = {
  initialCaseData: InitialCaseData;
  isVariant?: boolean;
  sessionId?: string;
  isAdmin?: boolean;
  /** Se false (casi demo senza DB), l’abbandono non crea SessionReport e torna solo al dashboard. */
  persistReports?: boolean;
};

function SimulatorNavBar({
  dismissCase,
}: {
  dismissCase?: { loading: boolean; onClick: () => void };
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex h-12 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md shadow-sm">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        Dashboard
      </Link>
      {dismissCase ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs border-rose-200/80 text-rose-800 hover:bg-rose-50"
          disabled={dismissCase.loading}
          onClick={dismissCase.onClick}
          title="Dismiss case — all scores recorded as 0"
        >
          {dismissCase.loading ? "Uscita…" : "Abbandona caso"}
        </Button>
      ) : null}
    </header>
  );
}

export function SimulatorClient({
  initialCaseData,
  isVariant,
  sessionId,
  isAdmin = false,
  persistReports = true,
}: SimulatorClientProps) {
  const router = useRouter();

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "exam" | "tests">("history");
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examsConfirmed, setExamsConfirmed] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPatientChartOpen, setIsPatientChartOpen] = useState(false);

  const [examFindings, setExamFindings] = useState<
    Record<string, { id: string; label: string; finding: string; numericValue: number | null }>
  >({});

  type GameStatus =
    | "playing"
    | "checking_diagnosis"
    | "wrong_diagnosis"
    | "success"
    | "complication"
    | "showing_report";

  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [enableAiSurprises, setEnableAiSurprises] = useState(false);
  const [forceAiSurprise, setForceAiSurprise] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [expectedConditionText, setExpectedConditionText] = useState<string | null>(null);
  const [debugTargetCondition, setDebugTargetCondition] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<
    "clinical" | "legal" | "prescribing" | "empathy" | "economy"
  >("clinical");

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<null | {
    scores: { clinical: number; legal: number; exams: number; empathy: number; economy: number };
    feedback: {
      clinicalNote: string;
      legalComplianceNote: string;
      prescribingNote: string;
      empathyNote: string;
      economyNote: string;
      strengths: string[];
      weaknesses: string[];
      correctSolution: string;
    };
    evidence?: { legalSources: string[]; protocolSources: string[] };
    totalScore?: number;
  }>(null);

  const [effectiveSessionId, setEffectiveSessionId] = useState<string | undefined>(sessionId);
  const [isStartingEmergency, setIsStartingEmergency] = useState(false);
  const [dismissLoading, setDismissLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const ensureSessionId = async (): Promise<string | null> => {
    if (effectiveSessionId) return effectiveSessionId;
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: initialCaseData.id,
          mode: "original",
        }),
      });
      const data = await res.json().catch(() => null);
      const newSessionId = data?.sessionId as string | undefined;
      if (newSessionId) {
        setEffectiveSessionId(newSessionId);
        return newSessionId;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDismissCase = async () => {
    const confirmed = window.confirm(
      "Abbandonare il caso (Dismiss case)? Verrà registrato un punteggio di 0 su tutti gli assi di valutazione.",
    );
    if (!confirmed) return;

    if (!persistReports) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setDismissLoading(true);
    try {
      const liveId = (await ensureSessionId()) ?? undefined;
      const res = await fetch("/api/session/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: initialCaseData.id,
          ...(liveId ? { liveSessionId: liveId } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as { sessionId?: string } | null;
      if (!res.ok || !data?.sessionId) {
        throw new Error("dismiss failed");
      }
      router.push(`/case/${initialCaseData.id}/results?sessionId=${data.sessionId}`);
      router.refresh();
    } catch {
      setDismissLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveSessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: initialCaseData.id,
            mode: "original",
          }),
        });
        const data = await res.json().catch(() => null);
        const newSessionId = data?.sessionId as string | undefined;
        if (!cancelled && newSessionId) {
          setEffectiveSessionId(newSessionId);
          router.replace(`/case/${initialCaseData.id}?sessionId=${newSessionId}`);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveSessionId, initialCaseData.id, router]);

  useEffect(() => {
    if (!effectiveSessionId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/session/state?sessionId=${effectiveSessionId}`);
      const data = await res.json().catch(() => null);
      if (!cancelled && data?.targetCondition) {
        setDebugTargetCondition(String(data.targetCondition));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveSessionId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casePrompt: initialCaseData.patientPrompt,
          caseId: initialCaseData.id,
          sessionId: effectiveSessionId,
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      const flushLine = (line: string) => {
        // AI SDK data stream v1 text delta: 0:"..."
        if (line.startsWith("0:")) {
          const payload = line.slice(2);
          try {
            const chunk = JSON.parse(payload);
            if (typeof chunk === "string" && chunk.length > 0) {
              assistantText += chunk;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m)),
              );
            }
          } catch {
            // ignore malformed stream line
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          flushLine(trimmedLine);
        }
      }

      if (buffer.trim()) {
        flushLine(buffer.trim());
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Errore nella chat. Riprova tra qualche secondo." }
            : m,
        ),
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const selectedExams = useMemo(
    () => AVAILABLE_EXAMS.filter((exam) => selectedExamIds.includes(exam.id)),
    [selectedExamIds],
  );

  const totalCost = selectedExams.reduce((sum, exam) => sum + exam.cost, 0);
  const totalMinutes = selectedExams.reduce((sum, exam) => sum + exam.timeMinutes, 0);

  const demo = initialCaseData.demographics ?? {};
  const ageValue = demo.age ?? 58;
  const sexValue = (demo.sex === "F" || demo.sex === "M") ? demo.sex : "M";
  const contextValue = demo.context ?? initialCaseData.specialty ?? "Specialità non specificata";

  const patient = {
    age: ageValue,
    sex: (sexValue === "F" ? "F" : "M") as "M" | "F",
    mainComplaint: initialCaseData.description,
    context: contextValue,
    id: `CASE-${String(initialCaseData.id ?? "").slice(0, 6).toUpperCase() || "DEMO"}`,
  };

  const handleExamFinding = (payload: {
    id: string;
    label: string;
    result: { finding: string; numericValue: number | null };
  }) => {
    setExamFindings((prev) => ({
      ...prev,
      [payload.id]: {
        id: payload.id,
        label: payload.label,
        finding: payload.result.finding,
        numericValue: payload.result.numericValue,
      },
    }));
  };

  const toggleExam = (examId: string) => {
    if (examsConfirmed) return;
    setSelectedExamIds((current) =>
      current.includes(examId)
        ? current.filter((id) => id !== examId)
        : [...current, examId],
    );
  };

  const handleConcludeCase = async () => {
    if (!initialCaseData.id) return;
    if (!reportText.trim()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        caseId: String(initialCaseData.id),
        chatHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        exams: selectedExams,
        reportText,
        caseContext: initialCaseData.patientPrompt,
      };

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Errore nella valutazione del caso.");
      }

      const data = await res.json();
      router.push(`/case/${initialCaseData.id}/results?sessionId=${data.sessionId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportMock = {
    overview:
      "Esito complessivo: gestione solida, buona comunicazione. Migliorabile l’appropriatezza di alcuni accertamenti.",
    history:
      "Anamnesi: dolore toracico oppressivo, insorgenza 2h, irradiazione, fattori di rischio e sintomi associati raccolti.",
    diagnostics:
      "Diagnostica: ECG, troponina, Rx torace. Valutare serialità markers e stratificazione rischio.",
    therapy:
      "Terapia: stabilizzazione, analgesia, antiaggregazione/anticoagulazione secondo contesto, monitoraggio e rivalutazione.",
    timeline:
      "Timeline: T0 triage → T+10 anamnesi → T+25 esame obiettivo → T+40 esami → T+90 rivalutazione → conclusione.",
  } as const;

  const confirmDiagnosis = () => {
    if (!finalDiagnosis.trim()) return;
    setGameStatus("checking_diagnosis");

    window.setTimeout(async () => {
      try {
        const res = await fetch("/api/session/check-diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: initialCaseData.id,
            sessionId: effectiveSessionId,
            diagnosisText: finalDiagnosis,
          }),
        });

        const verdict = (await res.json().catch(() => null)) as
          | { isCorrect: boolean; expectedCondition?: string }
          | null;

        const isCorrect = Boolean(verdict && verdict.isCorrect);
        setExpectedConditionText(
          verdict?.expectedCondition ? String(verdict.expectedCondition) : null,
        );

        if (isCorrect) {
          // Debug / QA: forza sempre l'imprevisto se richiesto
          if (forceAiSurprise) {
            setGameStatus("complication");
            return;
          }

          // Imprevisto: 20% se toggle attivo
          if (enableAiSurprises && Math.random() < 0.2) {
            setGameStatus("complication");
            return;
          }

          setGameStatus("success");

          if (effectiveSessionId) {
            await fetch("/api/session/outcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: effectiveSessionId,
                caseId: initialCaseData.id,
                basePatientPrompt: initialCaseData.patientPrompt,
                outcome: "success",
              }),
            });
            router.replace(`/case/${initialCaseData.id}?sessionId=${effectiveSessionId}`);
          }
          return;
        }

        setGameStatus("wrong_diagnosis");
        if (effectiveSessionId) {
          await fetch("/api/session/outcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: effectiveSessionId,
              caseId: initialCaseData.id,
              basePatientPrompt: initialCaseData.patientPrompt,
              outcome: "wrong_diagnosis",
            }),
          });
          router.replace(`/case/${initialCaseData.id}?sessionId=${effectiveSessionId}`);
        }
      } catch {
        // fallback safe: don't block the flow; treat as success but without surprise
        setGameStatus("success");
      }
    }, 2000);
  };

  if (gameStatus === "showing_report") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-stretch justify-center px-4 pt-16 pb-10">
        <SimulatorNavBar />
        <div className="w-full max-w-6xl flex flex-col gap-6">
          <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Report finale</CardTitle>
              <CardDescription>
                Naviga tra le sezioni del report per rivedere anamnesi, diagnostica e terapia.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(
                  [
                    { id: "clinical", label: "Accuratezza clinica" },
                    { id: "legal", label: "Legal compliance" },
                    { id: "prescribing", label: "Appropriatezza prescrittiva" },
                    { id: "empathy", label: "Empatia" },
                    { id: "economy", label: "Sostenibilità economica" },
                  ] as const
                ).map((t) => {
                  const isActive = t.id === activeReportTab;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveReportTab(t.id)}
                      className={
                        "relative -mb-px flex items-center gap-2 rounded-t-2xl border px-4 py-2 text-[11px] font-medium transition-colors whitespace-nowrap " +
                        (isActive
                          ? "bg-white border-zinc-200 text-zinc-950"
                          : "bg-zinc-100/80 border-zinc-200/80 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100")
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-b-2xl rounded-tr-2xl border border-zinc-200/80 bg-white p-5 text-sm text-zinc-800 leading-relaxed space-y-3">
                {reportLoading && (
                  <div className="text-sm text-zinc-700">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-spin text-sky-600" />
                      Generazione report in corso...
                    </span>
                  </div>
                )}
                {!reportLoading && reportError && (
                  <div className="text-sm text-rose-700">{reportError}</div>
                )}
                {!reportLoading && reportData && (
                  <>
                    {activeReportTab === "clinical" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.clinical)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.clinicalNote}</p>
                      </>
                    )}
                    {activeReportTab === "legal" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.legal)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.legalComplianceNote}</p>
                        {reportData.evidence?.legalSources?.length ? (
                          <div className="text-xs text-zinc-600">
                            <span className="font-medium">Fonti (tag: legale):</span>{" "}
                            {reportData.evidence.legalSources.join(" · ")}
                          </div>
                        ) : null}
                      </>
                    )}
                    {activeReportTab === "prescribing" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.exams)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.prescribingNote}</p>
                        {reportData.evidence?.protocolSources?.length ? (
                          <div className="text-xs text-zinc-600">
                            <span className="font-medium">Fonti (tag: protocolli):</span>{" "}
                            {reportData.evidence.protocolSources.join(" · ")}
                          </div>
                        ) : null}
                      </>
                    )}
                    {activeReportTab === "empathy" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.empathy)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.empathyNote}</p>
                      </>
                    )}
                    {activeReportTab === "economy" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.economy)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.economyNote}</p>
                      </>
                    )}
                  </>
                )}
                {!reportLoading && !reportData && !reportError && (
                  <div className="text-sm text-zinc-500">Report non disponibile.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-stretch justify-center px-4 pt-16 pb-10">
      <SimulatorNavBar
        dismissCase={
          persistReports && disclaimerAccepted
            ? { loading: dismissLoading, onClick: handleDismissCase }
            : undefined
        }
      />
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Simulazione caso clinico
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{initialCaseData.title}</h1>
              {isVariant ? (
                <Badge className="border-purple-500 text-purple-700 bg-purple-50 inline-flex items-center gap-1 text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  Variante IA
                </Badge>
              ) : (
                <Badge className="text-[10px]">Caso originale</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-600">
              {initialCaseData.specialty
                ? `${initialCaseData.specialty} · Obiettivo: ottimizzare rischio clinico, responsabilità medico-legale e risorse.`
                : "Obiettivo: gestire il percorso diagnostico-terapeutico ottimizzando rischio clinico, responsabilità medico-legale e risorse."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs text-zinc-600 shadow-sm">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sessione in corso</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 items-start">
          <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Interfaccia clinica
                </CardTitle>
                <CardDescription>
                  Alterna tra anamnesi, esame obiettivo e richieste di esami.
                </CardDescription>
              </div>
              <TabsList>
                <TabsTrigger
                  value="history"
                  currentValue={activeTab}
                  onSelect={(value) => setActiveTab(value as typeof activeTab)}
                >
                  Anamnesi
                </TabsTrigger>
                <TabsTrigger
                  value="exam"
                  currentValue={activeTab}
                  onSelect={(value) => setActiveTab(value as typeof activeTab)}
                >
                  Esame obiettivo
                </TabsTrigger>
                <TabsTrigger
                  value="tests"
                  currentValue={activeTab}
                  onSelect={(value) => setActiveTab(value as typeof activeTab)}
                >
                  Richiesta esami
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as typeof activeTab)}
              >
                <TabsContent
                  value="history"
                  currentValue={activeTab}
                  className="mt-3"
                >
                  <HistoryChat
                    messages={messages}
                    input={input}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    isLoading={isChatLoading}
                  />
                </TabsContent>
                <TabsContent
                  value="exam"
                  currentValue={activeTab}
                  className="mt-3"
                >
                  <PhysicalExamTab
                    sessionId={effectiveSessionId}
                    patientPrompt={initialCaseData.patientPrompt}
                    caseId={initialCaseData.id}
                    onExamResult={handleExamFinding}
                  />
                </TabsContent>
                <TabsContent
                  value="tests"
                  currentValue={activeTab}
                  className="mt-3"
                >
                  <ExamsPanel
                    selectedExamIds={selectedExamIds}
                    onToggleExam={toggleExam}
                    isConfirmed={examsConfirmed}
                    onConfirm={() => setExamsConfirmed(true)}
                    onUnlock={() => setExamsConfirmed(false)}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Paziente
                  </CardTitle>
                  <CardDescription>Identificativo caso e dati essenziali.</CardDescription>
                </div>
                <span className="rounded-full bg-white border border-zinc-200/80 px-4 py-1.5 text-xs font-mono text-zinc-800 whitespace-nowrap">
                  {patient.id}
                </span>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100">
                    <HeartPulse className="h-5 w-5 text-rose-500" />
                  </div>
                  <span className="text-sm">
                    {patient.age} anni – {patient.sex === "M" ? "Maschio" : "Femmina"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPatientChartOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  title="Apri cartella paziente"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Monitor simulazione
                  </CardTitle>
                  <CardDescription>
                    Tempo procedurale e costo cumulativo degli esami richiesti.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-zinc-200/80 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-medium text-zinc-800">
                      {totalMinutes || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EuroIcon className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-zinc-800">
                      {totalCost.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500">
                    Esami richiesti
                  </span>
                  {selectedExams.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Nessun esame ancora richiesto. Ogni richiesta aggiorna automaticamente tempo e costo simulati.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {selectedExams.map((exam) => (
                        <li
                          key={exam.id}
                          className="flex items-center justify-between rounded-2xl bg-white border border-zinc-200/80 px-3 py-1.5"
                        >
                          <span className="truncate text-zinc-950">{exam.name}</span>
                          <span className="ml-3 flex items-center gap-3 text-[11px] text-zinc-500">
                            <span>{exam.timeMinutes}</span>
                            <span>{exam.cost}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Conclusione caso
                </CardTitle>
                <CardDescription>
                  Emetti diagnosi e trattamento, gestisci eventuali imprevisti e consulta il report finale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {gameStatus === "playing" && (
                  <div className="space-y-4">
                    {isAdmin && debugTargetCondition && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
                        <span className="font-medium">Debug – patologia target (sessione):</span>{" "}
                        {debugTargetCondition}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-zinc-700">
                        Diagnosi finale
                      </label>
                      <Textarea
                        className="min-h-24 text-xs"
                        placeholder="Scrivi la diagnosi finale (es. NSTEMI, polmonite lobare, ecc.)..."
                        value={finalDiagnosis}
                        onChange={(e) => setFinalDiagnosis(e.target.value)}
                      />
                    </div>

                    {isAdmin && (
                      <>
                        <div className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-medium text-zinc-800">
                                Abilita Imprevisti AI (20% probabilità)
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Se attivo, può comparire una complicazione improvvisa.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEnableAiSurprises((v) => !v)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                                enableAiSurprises
                                  ? "bg-emerald-500/90 border-emerald-600"
                                  : "bg-zinc-200 border-zinc-300"
                              }`}
                              aria-pressed={enableAiSurprises}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                                  enableAiSurprises ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setForceAiSurprise((v) => !v)}
                            className={`text-[11px] font-medium rounded-full border px-3 py-1.5 transition-colors ${
                              forceAiSurprise
                                ? "bg-amber-50 border-amber-200 text-amber-900"
                                : "bg-white border-zinc-200/80 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                            }`}
                            title="Solo test: forza sempre l'imprevisto quando la diagnosi è corretta"
                          >
                            {forceAiSurprise ? "Forza imprevisto: ON" : "Forza imprevisto: OFF"}
                          </button>
                        </div>
                      </>
                    )}

                    <Button
                      type="button"
                      size="lg"
                      className="w-full justify-center text-sm"
                      onClick={confirmDiagnosis}
                      disabled={!finalDiagnosis.trim()}
                    >
                      Conferma Diagnosi
                    </Button>
                  </div>
                )}

                {gameStatus === "checking_diagnosis" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3 py-3 text-zinc-700">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-spin text-sky-600" />
                      Verifica diagnosi in corso...
                    </span>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Simulazione chiamata AI (2 secondi).
                    </p>
                  </div>
                )}

                {(gameStatus === "wrong_diagnosis" ||
                  gameStatus === "success" ||
                  gameStatus === "complication") && (
                  <div className="space-y-3">
                    {gameStatus === "wrong_diagnosis" && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-800">
                        Diagnosi Errata. Il trattamento somministrato ha peggiorato il quadro.
                        {expectedConditionText && (
                          <div className="mt-2 text-[11px] text-rose-700">
                            <span className="font-medium">Patologia corretta:</span>{" "}
                            {expectedConditionText}
                          </div>
                        )}
                      </div>
                    )}
                    {gameStatus === "success" && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-800">
                        Diagnosi Corretta! Il paziente è stato trattato con successo ed è in via di dimissione.
                      </div>
                    )}
                    {gameStatus === "complication" && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900">
                        Diagnosi Corretta, MA il paziente ha sviluppato una reazione allergica grave e improvvisa!
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      {gameStatus === "complication" ? (
                        <Button
                          type="button"
                          size="md"
                          className="text-xs px-4"
                          onClick={async () => {
                            if (isStartingEmergency) return;
                            setIsStartingEmergency(true);
                            try {
                              const sid = await ensureSessionId();
                              if (!sid) return;

                              await fetch("/api/session/complication", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  sessionId: sid,
                                  caseId: initialCaseData.id,
                                  basePatientPrompt: initialCaseData.patientPrompt,
                                  complication: "anaphylaxis",
                                }),
                              });

                              setDebugTargetCondition("Anafilassi / reazione allergica grave");
                              setFinalDiagnosis("");
                              setGameStatus("playing");
                              // NON navighiamo/ricarichiamo: vogliamo mantenere chat e reperti già raccolti.
                              // Le prossime richieste a /api/chat e /api/examine useranno sessionId e quindi
                              // il prompt/overrides aggiornati in questa sessione.
                            } finally {
                              setIsStartingEmergency(false);
                            }
                          }}
                          disabled={isStartingEmergency}
                        >
                          {isStartingEmergency ? "Avvio emergenza..." : "Gestisci emergenza"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="md"
                          className="text-xs px-4"
                          onClick={async () => {
                            setReportError(null);
                            setReportLoading(true);
                            setGameStatus("showing_report");
                            try {
                              const res = await fetch("/api/evaluate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  caseId: initialCaseData.id,
                                  chatHistory: messages
                                    .filter((m) => m.role === "user" || m.role === "assistant")
                                    .map((m) => ({ role: m.role, content: m.content })),
                                  exams: selectedExams,
                                  reportText: "",
                                  caseContext: initialCaseData.patientPrompt,
                                  finalDiagnosis,
                                }),
                              });
                              if (!res.ok) {
                                const data = await res.json().catch(() => null);
                                throw new Error(
                                  (data && (data.error as string | undefined)) ||
                                    "Errore nella generazione del report.",
                                );
                              }
                              const data = await res.json();
                              setReportData({
                                scores: data.scores,
                                feedback: data.feedback,
                                evidence: data.evidence,
                                totalScore: data.totalScore,
                              });
                            } catch (e: any) {
                              setReportError(e?.message ?? "Errore nella generazione del report.");
                            } finally {
                              setReportLoading(false);
                            }
                          }}
                        >
                          Vai al Report
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isPatientChartOpen}>
        <DialogContent className="bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cartella paziente</DialogTitle>
            <DialogDescription>
              Riepilogo sintomi principali, contesto e dati già raccolti in questa sessione.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5">
              <p className="text-[11px] font-medium text-zinc-700 mb-1">Dati anagrafici</p>
              <p className="text-sm text-zinc-900">
                {patient.age} anni – {patient.sex === "M" ? "Maschio" : "Femmina"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">{patient.id}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">Sintomo principale</p>
              <p className="text-sm text-zinc-900">{patient.mainComplaint}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">Contesto</p>
              <p className="text-xs text-zinc-700 whitespace-pre-line">{patient.context}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">
                Esami obiettivi già effettuati in questa sessione
              </p>
              {Object.keys(examFindings).length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  Nessun reperto di esame obiettivo ancora registrato.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {Object.values(examFindings).map((exam) => (
                    <li
                      key={exam.id}
                      className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs"
                    >
                      <p className="font-medium text-zinc-800">{exam.label}</p>
                      <p className="text-zinc-700 mt-0.5">
                        {exam.finding}
                        {typeof exam.numericValue === "number" && (
                          <span className="ml-1 text-zinc-500">({exam.numericValue})</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">Esami richiesti</p>
              {selectedExams.length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  Nessun esame ancora richiesto in questa sessione.
                </p>
              ) : (
                <ul className="space-y-1">
                  {selectedExams.map((exam) => (
                    <li key={exam.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-800">{exam.name}</span>
                      <span className="text-zinc-500">
                        {exam.timeMinutes} · {exam.cost}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              size="sm"
              className="text-xs"
              onClick={() => setIsPatientChartOpen(false)}
            >
              Chiudi cartella
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!disclaimerAccepted}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disclaimer medico-legale</DialogTitle>
            <DialogDescription>
              Questa piattaforma è destinata esclusivamente a scopi formativi e di simulazione.
              Le decisioni proposte dall&apos;app, dai modelli di intelligenza artificiale o dai
              contenuti dei casi non sostituiscono in alcun modo il giudizio clinico,
              l&apos;esperienza professionale o le linee guida ufficiali in vigore.
              <br />
              <br />
              Non utilizzare IterMed per prendere decisioni reali su pazienti o situazioni cliniche.
              Qualsiasi uso improprio ricade interamente sotto la responsabilità dell&apos;utente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Torna al dashboard
            </Link>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="text-xs"
              onClick={() => setDisclaimerAccepted(true)}
            >
              Accetto e desidero procedere
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type HistoryChatProps = {
  messages: {
    id: string;
    role: "user" | "assistant" | "system" | "function" | "data" | "tool";
    content?: string | Array<{ type?: string; text?: string } | string>;
    parts?: Array<{ type?: string; text?: string }>;
  }[];
  input: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
};

function HistoryChat({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: HistoryChatProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messageText = (message: HistoryChatProps["messages"][number]): string => {
    if (typeof message.content === "string" && message.content.trim()) {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      const text = message.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && typeof part.text === "string") return part.text;
          return "";
        })
        .join("");
      if (text.trim()) return text;
    }
    if (Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text as string)
        .join("");
      if (text.trim()) return text;
    }
    return "";
  };

  const visibleMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleMessages.length, isLoading]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/70 border border-zinc-200/80 p-3 h-[420px] overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto pr-1.5"
        onWheel={(event) => {
          // Some mouse wheels on Arc do not scroll nested containers reliably.
          if (!scrollRef.current) return;
          scrollRef.current.scrollTop += event.deltaY;
        }}
      >
        {visibleMessages.length === 0 && (
          <p className="text-[11px] text-zinc-500">
            Inizia l&apos;anamnesi ponendo una domanda aperta al paziente (es. &quot;Mi racconti cosa è successo da quando sono iniziati i sintomi&quot;).
          </p>
        )}
        {visibleMessages.map((message) => {
          const isDoctor = message.role === "user";
          const text = messageText(message);
          if (!text) return null;
          return (
            <div
              key={message.id}
              className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  isDoctor
                    ? "max-w-[70%] rounded-2xl bg-sky-600 text-white text-xs px-3 py-2 shadow-sm"
                    : "max-w-[70%] rounded-2xl bg-zinc-100 text-zinc-900 text-xs px-3 py-2 border border-zinc-200/80"
                }
              >
                {text}
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={onSubmit}
        className="mt-1 space-y-1.5"
      >
        <Textarea
          className="text-xs"
          rows={2}
          placeholder="Formula la prossima domanda o esplora un sintomo (es. caratteristiche del dolore, fattori di rischio, sintomi associati)..."
          value={input}
          onChange={onInputChange}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500">
            L&apos;IA risponde solo come paziente, senza formulare diagnosi o spiegare linee guida.
          </p>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="px-4 py-1.5 text-[11px]"
          >
            {isLoading ? "Risposta in corso..." : "Invia domanda"}
          </Button>
        </div>
      </form>
    </div>
  );
}

type ExamsPanelProps = {
  selectedExamIds: string[];
  onToggleExam: (id: string) => void;
  isConfirmed: boolean;
  onConfirm: () => void;
  onUnlock: () => void;
};

function ExamsPanel({
  selectedExamIds,
  onToggleExam,
  isConfirmed,
  onConfirm,
  onUnlock,
}: ExamsPanelProps) {
  const [query, setQuery] = useState("");
  const [openMacroId, setOpenMacroId] = useState<string | null>(EXAM_CATALOG[0]?.id ?? null);
  const [openGroupIds, setOpenGroupIds] = useState<Record<string, string | null>>({});
  const macroVisuals: Record<string, { short: string; icon: ComponentType<{ className?: string }> }> = {
    lab: { short: "Lab", icon: FlaskConical },
    img: { short: "Imaging", icon: ScanLine },
    strum: { short: "Strum", icon: Microscope },
    endo: { short: "Endo", icon: TestTube2 },
  };

  const selectedExams = useMemo(
    () => AVAILABLE_EXAMS.filter((exam) => selectedExamIds.includes(exam.id)),
    [selectedExamIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return AVAILABLE_EXAMS.filter((exam) => exam.name.toLowerCase().includes(q));
  }, [query]);

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const normalized = q.trim().toLowerCase();
    const i = text.toLowerCase().indexOf(normalized);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-amber-200/80 rounded px-0.5">{text.slice(i, i + normalized.length)}</mark>
        {text.slice(i + normalized.length)}
      </>
    );
  };

  const toggleGroup = (macroId: string, groupId: string) => {
    setOpenGroupIds((prev) => ({
      ...prev,
      [macroId]: prev[macroId] === groupId ? null : groupId,
    }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] gap-3 h-[420px]">
      <div className="rounded-2xl bg-white/70 border border-zinc-200/80 p-3 overflow-y-auto text-xs">
        <div className="relative mb-3">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca esami (es. troponina, TC torace, colonscopia...)"
            className="w-full h-9 rounded-xl border border-zinc-200/80 bg-white pl-8 pr-3 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        {query.trim() ? (
          <div className="space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-zinc-500">Nessun esame trovato.</p>
            ) : (
              filtered.map((exam) => {
                const isSelected = selectedExamIds.includes(exam.id);
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => onToggleExam(exam.id)}
                    disabled={isConfirmed}
                    className={
                      "w-full text-left rounded-xl border px-3 py-2 transition-colors " +
                      (isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-zinc-200/80 bg-white hover:bg-zinc-50") +
                      (isConfirmed ? " opacity-70 cursor-not-allowed" : "")
                    }
                  >
                    <p className="text-[11px] font-medium text-zinc-900">{highlight(exam.name, query)}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">€ {exam.cost} · {exam.timeMinutes} min</p>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {EXAM_CATALOG.map((macro) => {
                const Icon = macroVisuals[macro.id]?.icon ?? FlaskConical;
                const short = macroVisuals[macro.id]?.short ?? macro.label;
                const active = openMacroId === macro.id;
                return (
                  <button
                    key={`tab-${macro.id}`}
                    type="button"
                    onClick={() => setOpenMacroId(macro.id)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors " +
                      (active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50")
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {short}
                  </button>
                );
              })}
            </div>
            {EXAM_CATALOG.map((macro) => {
              const macroOpen = openMacroId === macro.id;
              return (
                <div key={macro.id} className="rounded-2xl border border-zinc-200/80 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenMacroId(macroOpen ? null : macro.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-semibold text-zinc-900"
                  >
                    <span>{macro.label}</span>
                    <span className="text-zinc-500">{macroOpen ? "−" : "+"}</span>
                  </button>
                  {macroOpen ? (
                    <div className="px-2 pb-2 space-y-2">
                      {macro.groups.length === 1 ? (
                        <div className="px-1 pb-1 space-y-1.5">
                          {macro.groups[0].exams.map((exam) => {
                            const isSelected = selectedExamIds.includes(exam.id);
                            return (
                              <button
                                key={exam.id}
                                type="button"
                                onClick={() => onToggleExam(exam.id)}
                                disabled={isConfirmed}
                                className={
                                  "w-full text-left rounded-lg border px-2.5 py-2 transition-colors " +
                                  (isSelected
                                    ? "border-emerald-300 bg-emerald-50"
                                    : "border-zinc-200/80 bg-white hover:bg-zinc-100") +
                                  (isConfirmed ? " opacity-70 cursor-not-allowed" : "")
                                }
                              >
                                <p className="text-[11px] text-zinc-900">{exam.name}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">€ {exam.cost} · {exam.timeMinutes} min</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        macro.groups.map((group) => {
                        const groupOpen = openGroupIds[macro.id] === group.id;
                        return (
                          <div key={group.id} className="rounded-xl border border-zinc-200/80 bg-zinc-50/70">
                            <button
                              type="button"
                              onClick={() => toggleGroup(macro.id, group.id)}
                              className="w-full flex items-center justify-between px-2.5 py-2 text-[11px] font-medium text-zinc-800"
                            >
                              <span>{group.label}</span>
                              <span className="text-zinc-500">{groupOpen ? "−" : "+"}</span>
                            </button>
                            {groupOpen ? (
                              <div className="px-2 pb-2 space-y-1.5">
                                {group.exams.map((exam) => {
                                  const isSelected = selectedExamIds.includes(exam.id);
                                  return (
                                    <button
                                      key={exam.id}
                                      type="button"
                                      onClick={() => onToggleExam(exam.id)}
                                      disabled={isConfirmed}
                                      className={
                                        "w-full text-left rounded-lg border px-2.5 py-2 transition-colors " +
                                        (isSelected
                                          ? "border-emerald-300 bg-emerald-50"
                                          : "border-zinc-200/80 bg-white hover:bg-zinc-100") +
                                        (isConfirmed ? " opacity-70 cursor-not-allowed" : "")
                                      }
                                    >
                                      <p className="text-[11px] text-zinc-900">{exam.name}</p>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">€ {exam.cost} · {exam.timeMinutes} min</p>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      }))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white/70 border border-zinc-200/80 p-3 flex flex-col min-h-0">
        <p className="text-[11px] font-medium text-zinc-700 mb-2">Ricettario · Esami selezionati</p>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {selectedExams.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Nessun esame selezionato.</p>
          ) : (
            selectedExams.map((exam) => (
              <div key={exam.id} className="rounded-xl border border-zinc-200/80 bg-white px-2.5 py-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] text-zinc-900">{exam.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">€ {exam.cost} · {exam.timeMinutes} min</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleExam(exam.id)}
                  disabled={isConfirmed}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                  title="Rimuovi esame"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        {isConfirmed ? (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-800">
              Richiesta esami confermata.
            </div>
            <Button type="button" size="sm" variant="outline" className="text-[11px]" onClick={onUnlock}>
              Modifica richiesta
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            className="mt-3 text-[11px]"
            onClick={onConfirm}
            disabled={selectedExams.length === 0}
          >
            Conferma Richiesta Esami
          </Button>
        )}
      </div>
    </div>
  );
}

