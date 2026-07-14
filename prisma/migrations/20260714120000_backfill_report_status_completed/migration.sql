-- Backfill legacy reports that were created before async status fields existed.
UPDATE "SessionReport"
SET
  "status" = 'COMPLETED',
  "progress" = 100,
  "progressMessage" = 'Report pronto!'
WHERE "completedAt" IS NOT NULL
  AND "status" = 'PENDING';
