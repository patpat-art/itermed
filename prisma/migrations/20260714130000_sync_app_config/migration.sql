-- Legacy AppConfig table (previously created via raw SQL in /admin/exams).
-- Idempotent sync so migration history matches the live database.
CREATE TABLE IF NOT EXISTS "AppConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("key")
);
