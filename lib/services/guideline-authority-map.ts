/** Maps medical specialty to international guideline authorities for evaluation commentary. */
export function resolveGuidelineAuthorities(specialty?: string): string[] {
  const s = (specialty ?? "").toLowerCase();

  if (/cardio|cuore|infarto|acs|stemi|nstemi/i.test(s)) {
    return ["ESC (European Society of Cardiology)", "AHA/ACC"];
  }
  if (/pneumo|asma|bpco|respir/i.test(s)) {
    return ["GINA", "GOLD", "ERS/ATS"];
  }
  if (/neuro|ictus|epiless|cefalea/i.test(s)) {
    return ["ESO (European Stroke Organisation)", "AAN"];
  }
  if (/endo|diabete|tiroide/i.test(s)) {
    return ["EASD", "ADA", "ETA"];
  }
  if (/gastro|epat|colon/i.test(s)) {
    return ["ESGE", "EASL", "ACG"];
  }
  if (/infett|sepsi|hiv/i.test(s)) {
    return ["IDSA", "ESCMID", "Surviving Sepsis Campaign"];
  }
  if (/emerg|pronto|urgen/i.test(s)) {
    return ["ACEP", "ERC", "Linee guida SIMEU"];
  }

  return ["Linee guida internazionali di riferimento", "WHO", "NICE"];
}

export const BANNED_GENERIC_PHRASES = [
  "nel complesso",
  "buona comunicazione",
  "potrebbe migliorare",
  "discreta",
  "sufficiente",
  "abbastanza buono",
  "in generale",
  "nel complesso positivo",
];
