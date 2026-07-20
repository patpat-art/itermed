-- Specialty-centric RAG: link guideline documents to MedicalSpecialty
ALTER TABLE "GuidelineDocument" ADD COLUMN "medicalSpecialtyId" TEXT;

CREATE INDEX "GuidelineDocument_medicalSpecialtyId_idx" ON "GuidelineDocument"("medicalSpecialtyId");

CREATE INDEX "GuidelineDocument_isActive_medicalSpecialtyId_idx" ON "GuidelineDocument"("isActive", "medicalSpecialtyId");

ALTER TABLE "GuidelineDocument" ADD CONSTRAINT "GuidelineDocument_medicalSpecialtyId_fkey" FOREIGN KEY ("medicalSpecialtyId") REFERENCES "MedicalSpecialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
