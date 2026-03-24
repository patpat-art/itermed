-- AlterTable
ALTER TABLE "ClinicalCase" ADD COLUMN IF NOT EXISTS "baselineExamFindings" JSONB;
