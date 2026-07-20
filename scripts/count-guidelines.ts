/**
 * Count guideline documents (sanity check before/after seed).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.guidelineDocument.count();
  const rows = await prisma.guidelineDocument.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { title: true, isActive: true, tags: true, chunkCount: true, sourceType: true },
  });
  console.log("guidelineDocument count:", count);
  console.table(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
