-- AlterTable
ALTER TABLE "ClinicalCase" ADD COLUMN     "legalProtectionPackageId" TEXT,
ADD COLUMN     "medicalSpecialtyId" TEXT;

-- AlterTable
ALTER TABLE "SessionReport" ADD COLUMN     "difficultySnapshot" "CaseDifficulty",
ADD COLUMN     "medicalSpecialtyIdSnapshot" TEXT,
ADD COLUMN     "medicalSpecialtyNameSnapshot" TEXT;

-- CreateTable
CREATE TABLE "MedicalSpecialty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalProtectionPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "specialtyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalProtectionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalProtectionDocument" (
    "packageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LegalProtectionDocument_pkey" PRIMARY KEY ("packageId","documentId")
);

-- CreateTable
CREATE TABLE "ClinicalCaseLegalDocument" (
    "caseId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClinicalCaseLegalDocument_pkey" PRIMARY KEY ("caseId","documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalSpecialty_name_key" ON "MedicalSpecialty"("name");

-- CreateIndex
CREATE INDEX "LegalProtectionPackage_specialtyId_idx" ON "LegalProtectionPackage"("specialtyId");

-- CreateIndex
CREATE INDEX "LegalProtectionDocument_documentId_idx" ON "LegalProtectionDocument"("documentId");

-- CreateIndex
CREATE INDEX "ClinicalCaseLegalDocument_documentId_idx" ON "ClinicalCaseLegalDocument"("documentId");

-- CreateIndex
CREATE INDEX "ClinicalCase_medicalSpecialtyId_idx" ON "ClinicalCase"("medicalSpecialtyId");

-- CreateIndex
CREATE INDEX "ClinicalCase_legalProtectionPackageId_idx" ON "ClinicalCase"("legalProtectionPackageId");

-- CreateIndex
CREATE INDEX "ClinicalCase_difficulty_idx" ON "ClinicalCase"("difficulty");

-- CreateIndex
CREATE INDEX "SessionReport_userId_completedAt_idx" ON "SessionReport"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "SessionReport_userId_caseId_completedAt_idx" ON "SessionReport"("userId", "caseId", "completedAt");

-- CreateIndex
CREATE INDEX "SessionReport_medicalSpecialtyIdSnapshot_idx" ON "SessionReport"("medicalSpecialtyIdSnapshot");

-- AddForeignKey
ALTER TABLE "LegalProtectionPackage" ADD CONSTRAINT "LegalProtectionPackage_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "MedicalSpecialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalProtectionDocument" ADD CONSTRAINT "LegalProtectionDocument_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LegalProtectionPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalProtectionDocument" ADD CONSTRAINT "LegalProtectionDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCase" ADD CONSTRAINT "ClinicalCase_medicalSpecialtyId_fkey" FOREIGN KEY ("medicalSpecialtyId") REFERENCES "MedicalSpecialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCase" ADD CONSTRAINT "ClinicalCase_legalProtectionPackageId_fkey" FOREIGN KEY ("legalProtectionPackageId") REFERENCES "LegalProtectionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseLegalDocument" ADD CONSTRAINT "ClinicalCaseLegalDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseLegalDocument" ADD CONSTRAINT "ClinicalCaseLegalDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GuidelineDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
