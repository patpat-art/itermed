-- CreateTable
CREATE TABLE "GuidelineDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceType" TEXT NOT NULL DEFAULT 'TEXT',
    "sourceName" TEXT,
    "text" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "vectorIds" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuidelineDocument_pkey" PRIMARY KEY ("id")
);
