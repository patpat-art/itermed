/**
 * Promote all users (or a specific email) to ADMIN.
 *
 * Usage:
 *   npx tsx scripts/promote-admins.ts
 *   npx tsx scripts/promote-admins.ts --email=you@example.com
 *
 * Loads DATABASE_URL from .env / .env.local (same as the app).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const emailFlag = process.argv.find((a) => a.startsWith("--email="));
const emailFilter = emailFlag?.slice("--email=".length)?.trim().toLowerCase() || null;

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set. Configure .env.local before running.");
  }

  const prisma = new PrismaClient();
  try {
    const where = emailFilter ? { email: emailFilter } : {};
    const before = await prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    if (before.length === 0) {
      console.log(emailFilter ? `No user found for email: ${emailFilter}` : "No users in database.");
      return;
    }

    const result = await prisma.user.updateMany({
      where,
      data: { role: "ADMIN" },
    });

    const after = await prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Updated ${result.count} user(s) → ADMIN`);
    console.table(
      after.map((u) => ({
        email: u.email,
        previous: before.find((b) => b.id === u.id)?.role ?? "?",
        role: u.role,
      })),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
