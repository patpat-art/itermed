-- CreateTable
CREATE TABLE "SimulationMilestone" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "milestoneKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimulationMilestone_sessionId_idx" ON "SimulationMilestone"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationMilestone_sessionId_milestoneKey_key" ON "SimulationMilestone"("sessionId", "milestoneKey");

-- AddForeignKey
ALTER TABLE "SimulationMilestone" ADD CONSTRAINT "SimulationMilestone_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CaseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
