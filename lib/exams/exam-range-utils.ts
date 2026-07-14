/** Parses numeric min/max from legacy normalFinding strings (e.g. "0.5 – 2.2 mmol/L"). */
export function parseNormalRangeFromText(
  text: string,
): { min: number | null; max: number | null; unit: string } {
  const trimmed = text.trim();
  if (!trimmed) return { min: null, max: null, unit: "" };

  const rangeMatch = trimmed.match(
    /([<>≤≥]?\s*[\d]+[.,]?\d*)\s*[–\-—]\s*([<>≤≥]?\s*[\d]+[.,]?\d*)\s*([a-zA-Z%/µμ°]+.*)?$/,
  );
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(",", ".").replace(/[^\d.]/g, ""));
    const max = parseFloat(rangeMatch[2].replace(",", ".").replace(/[^\d.]/g, ""));
    return {
      min: Number.isFinite(min) ? min : null,
      max: Number.isFinite(max) ? max : null,
      unit: (rangeMatch[3] ?? "").trim(),
    };
  }

  const upperOnly = trimmed.match(/^[<≤]\s*([\d]+[.,]?\d*)\s*([a-zA-Z%/µμ°]+.*)?$/);
  if (upperOnly) {
    const max = parseFloat(upperOnly[1].replace(",", "."));
    return {
      min: null,
      max: Number.isFinite(max) ? max : null,
      unit: (upperOnly[2] ?? "").trim(),
    };
  }

  const lowerOnly = trimmed.match(/^[>≥]\s*([\d]+[.,]?\d*)\s*([a-zA-Z%/µμ°]+.*)?$/);
  if (lowerOnly) {
    const min = parseFloat(lowerOnly[1].replace(",", "."));
    return {
      min: Number.isFinite(min) ? min : null,
      max: null,
      unit: (lowerOnly[2] ?? "").trim(),
    };
  }

  return { min: null, max: null, unit: "" };
}

export function isValueInNormalRange(
  value: number,
  min: number | null | undefined,
  max: number | null | undefined,
): boolean {
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function formatNormalRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: string,
): string {
  const u = unit ? ` ${unit}` : "";
  if (min != null && max != null) return `${min} – ${max}${u}`;
  if (max != null) return `< ${max}${u}`;
  if (min != null) return `> ${min}${u}`;
  return "";
}
