/**
 * AEQUAN local development configuration.
 * All backend/LLM/PDF services point to localhost — never production URLs.
 */
export const AEQUAN_LOCAL_API_BASE =
  process.env.NEXT_PUBLIC_AEQUAN_API_URL ?? "http://localhost:8000";

export const AEQUAN_APP_NAME = "AEQUAN";
export const AEQUAN_TAGLINE = "Medical-Legal Training Simulator";

/** Feature flag: use mock data instead of live API (demo routes). */
export const AEQUAN_USE_MOCK =
  process.env.NEXT_PUBLIC_AEQUAN_MOCK === "true" ||
  process.env.NODE_ENV === "development";
