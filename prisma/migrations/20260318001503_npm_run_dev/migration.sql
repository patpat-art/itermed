-- CreateTable
CREATE TABLE "CaseSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "isVariant" BOOLEAN NOT NULL DEFAULT false,
    "variantPrompt" TEXT,
    "variantSolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseSession_userId_idx" ON "CaseSession"("userId");

-- CreateIndex
CREATE INDEX "CaseSession_caseId_idx" ON "CaseSession"("caseId");

-- AddForeignKey
ALTER TABLE "CaseSession" ADD CONSTRAINT "CaseSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSession" ADD CONSTRAINT "CaseSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
