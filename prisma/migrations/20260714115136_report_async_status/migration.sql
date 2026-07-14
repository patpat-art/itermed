-- CreateEnum
CREATE TYPE "SessionReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "SessionReport" ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressMessage" TEXT NOT NULL DEFAULT 'Inizializzazione report...',
ADD COLUMN     "status" "SessionReportStatus" NOT NULL DEFAULT 'PENDING';
