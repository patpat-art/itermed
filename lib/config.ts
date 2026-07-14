import { z } from "zod";

/** Next.js loads `.env` in the app process; this covers scripts/edge cases when cwd differs. */
function bootstrapEnvFromDisk(): void {
  if (typeof window !== "undefined") return;

  try {
    // Dynamic require keeps `node:fs` out of any accidental client bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require("node:fs") as typeof import("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path") as typeof import("node:path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require("dotenv") as typeof import("dotenv");

    const candidateFiles = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "itermed", ".env.local"),
      path.resolve(process.cwd(), "itermed", ".env"),
    ];

    for (const file of candidateFiles) {
      if (!existsSync(file)) continue;
      dotenv.config({ path: file });
      if (process.env.DATABASE_URL && process.env.OPENAI_API_KEY) {
        return;
      }
    }
  } catch {
    // Non-fatal: Next.js may already have injected env vars.
  }
}

bootstrapEnvFromDisk();

const normalizedEnv = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.NEXT_PUBLIC_DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY,
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    PINECONE_API_KEY: z.string().min(1).optional(),
    PINECONE_INDEX: z.string().min(1).optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    AUTH_SECRET: z.string().min(1).optional(),
    ITERMED_BOOTSTRAP_DEMO: z
      .string()
      .optional()
      .transform((value) => value === "true"),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    STRIPE_PRICE_STUDENT: z.string().min(1).optional(),
    STRIPE_PRICE_PREMIUM: z.string().min(1).optional(),
    STRIPE_BUNDLE_PRICES: z
      .string()
      .optional()
      .transform((raw) => {
        if (!raw?.trim()) return {} as Record<string, string>;
        try {
          const parsed = JSON.parse(raw) as Record<string, string>;
          return parsed ?? {};
        } catch {
          return {} as Record<string, string>;
        }
      }),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    const hasApiKey = Boolean(data.PINECONE_API_KEY);
    const hasIndex = Boolean(data.PINECONE_INDEX);

    if (hasApiKey !== hasIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PINECONE_API_KEY and PINECONE_INDEX must both be set or both omitted",
        path: ["PINECONE_API_KEY"],
      });
    }
  });

/**
 * Fully validated, typed application configuration loaded from environment variables.
 * Importing this module triggers fail-fast validation at startup.
 */
function loadConfig() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const envInput: Record<string, string | undefined> = {
    ...normalizedEnv,
    NODE_ENV: nodeEnv,
  };

  // Dev: ignore partial Pinecone config (RAG works without vector search).
  if (nodeEnv === "development") {
    const hasPineconeKey = Boolean(envInput.PINECONE_API_KEY);
    const hasPineconeIndex = Boolean(envInput.PINECONE_INDEX);
    if (hasPineconeKey !== hasPineconeIndex) {
      console.warn(
        "[itermed/config] DEV: Pinecone env incomplete — disabling vector RAG for this session.",
      );
      delete envInput.PINECONE_API_KEY;
      delete envInput.PINECONE_INDEX;
    }
  }

  const parsed = envSchema.safeParse(envInput);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");

    console.error("\n╔══════════════════════════════════════════════════════════╗");
    console.error("║  ITERMED — Invalid environment configuration             ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    console.error(details);
    console.error("\nFix: create or update `itermed/.env` with at least:");
    console.error("  DATABASE_URL=postgresql://...");
    console.error("  OPENAI_API_KEY=sk-...\n");

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  const env = parsed.data;
  const pineconeConfigured = Boolean(env.PINECONE_API_KEY && env.PINECONE_INDEX);

  return {
    NODE_ENV: env.NODE_ENV,
    DATABASE_URL: env.DATABASE_URL,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    PINECONE_API_KEY: env.PINECONE_API_KEY,
    PINECONE_INDEX: env.PINECONE_INDEX,
    AUTH_SECRET:
      env.NEXTAUTH_SECRET ??
      env.AUTH_SECRET ??
      "itermed-dev-secret-set-NEXTAUTH_SECRET-for-production",
    ITERMED_BOOTSTRAP_DEMO: env.ITERMED_BOOTSTRAP_DEMO,
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_PRICE_STUDENT: env.STRIPE_PRICE_STUDENT,
    STRIPE_PRICE_PREMIUM: env.STRIPE_PRICE_PREMIUM,
    STRIPE_BUNDLE_PRICES: env.STRIPE_BUNDLE_PRICES,
    APP_URL: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    isPineconeConfigured: pineconeConfigured,
    isStripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
  } as const;
}

export type AppConfig = ReturnType<typeof loadConfig>;

/** Singleton configuration object — validated once at module load. */
export const config: AppConfig = loadConfig();
