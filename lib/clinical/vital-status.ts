/** Adult clinical thresholds for multiparameter monitor status badges. */

export type VitalStatus = "stable" | "borderline" | "critical";

export type ClassifiedVital = {
  id: string;
  /** Short clinical acronym shown on the monitor (PA, FC, …). */
  label: string;
  /** Full Italian clinical name for tooltips / accessibility. */
  fullLabel: string;
  value: string;
  unit: string;
  status: VitalStatus;
};

export type DemoVitalsLike = {
  bp: string;
  hr: number;
  spo2: number;
  temp: string;
  rr: number;
};

const STATUS_RANK: Record<VitalStatus, number> = {
  stable: 0,
  borderline: 1,
  critical: 2,
};

export function maxVitalStatus(statuses: VitalStatus[]): VitalStatus {
  return statuses.reduce<VitalStatus>(
    (acc, s) => (STATUS_RANK[s] > STATUS_RANK[acc] ? s : acc),
    "stable",
  );
}

function hrStatus(hr: number): VitalStatus {
  if (hr < 45 || hr > 130) return "critical";
  if (hr < 55 || hr > 100) return "borderline";
  return "stable";
}

function spo2Status(spo2: number): VitalStatus {
  if (spo2 < 90) return "critical";
  if (spo2 < 94) return "borderline";
  return "stable";
}

function rrStatus(rr: number): VitalStatus {
  if (rr < 8 || rr > 28) return "critical";
  if (rr < 12 || rr > 20) return "borderline";
  return "stable";
}

function tempStatus(temp: number): VitalStatus {
  if (temp < 35 || temp >= 39) return "critical";
  if (temp < 36 || temp >= 37.8) return "borderline";
  return "stable";
}

function bpStatus(bp: string): VitalStatus {
  const match = bp.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return "borderline";
  const sys = Number(match[1]);
  const dia = Number(match[2]);
  if (!Number.isFinite(sys) || !Number.isFinite(dia)) return "borderline";
  if (sys < 90 || sys > 180 || dia > 110 || dia < 50) return "critical";
  if (sys < 100 || sys > 140 || dia > 90 || dia < 60) return "borderline";
  return "stable";
}

export function classifyVitals(vitals: DemoVitalsLike): ClassifiedVital[] {
  const tempNum = Number(String(vitals.temp).replace(",", "."));
  return [
    {
      id: "bp",
      label: "PA",
      fullLabel: "Pressione Arteriosa",
      value: vitals.bp,
      unit: "mmHg",
      status: bpStatus(vitals.bp),
    },
    {
      id: "hr",
      label: "FC",
      fullLabel: "Frequenza Cardiaca",
      value: String(vitals.hr),
      unit: "bpm",
      status: hrStatus(vitals.hr),
    },
    {
      id: "spo2",
      label: "SpO₂",
      fullLabel: "Saturazione Ossigeno",
      value: String(vitals.spo2),
      unit: "%",
      status: spo2Status(vitals.spo2),
    },
    {
      id: "temp",
      label: "T",
      fullLabel: "Temperatura",
      value: String(vitals.temp),
      unit: "°C",
      status: Number.isFinite(tempNum) ? tempStatus(tempNum) : "borderline",
    },
    {
      id: "rr",
      label: "FR",
      fullLabel: "Frequenza Respiratoria",
      value: String(vitals.rr),
      unit: "/min",
      status: rrStatus(vitals.rr),
    },
  ];
}

/** Clinical status labels for the multiparameter monitor. */
export function vitalStatusLabel(status: VitalStatus): string {
  switch (status) {
    case "critical":
      return "Critico";
    case "borderline":
      return "Alterato";
    default:
      return "Normale";
  }
}
