/** Shared per-minute limits for OpenAI-backed API routes (in-memory limiter). */
export const AI_RATE_LIMITS = {
  /** Max chat turns per user per minute — protects LLM API keys from abuse. */
  chat: 10,
  /** Evaluation / forensic report generation (alias: /api/evaluate). */
  simulationReport: 3,
  /** Analytics dashboard data refresh. */
  analytics: 20,
  sessionStart: 10,
  sessionStartVariant: 3,
  examine: 20,
  generateExams: 8,
  checkDiagnosis: 15,
  sessionOutcome: 10,
  sessionComplication: 10,
  register: 5,
} as const;
