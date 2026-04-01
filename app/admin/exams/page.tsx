import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { EXAM_DEFAULT_VALUES } from "../../../lib/exam-default-values";
import { AdminExamsEditor } from "./AdminExamsEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

async function saveExamValues(formData: FormData) {
  "use server";
  const payload = formData.get("payload");
  if (typeof payload !== "string") return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return;
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppConfig" (
      "key" TEXT PRIMARY KEY,
      "value" JSONB NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRaw`
    INSERT INTO "AppConfig" ("key", "value", "updatedAt")
    VALUES ('examValues', ${parsed as any}::jsonb, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
  `;
  revalidatePath("/admin/exams");
}

export default async function AdminExamsPage() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppConfig" (
      "key" TEXT PRIMARY KEY,
      "value" JSONB NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT "value" FROM "AppConfig" WHERE "key" = 'examValues' LIMIT 1`,
  )) as Array<{ value: unknown }>;
  const value = rows[0]?.value ?? EXAM_DEFAULT_VALUES;

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Valori esami</h1>
        <p className="text-sm text-zinc-500">
          Modifica costi, tempistiche e range fisiologici degli esami.
        </p>
      </header>
      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm">Configurazione visuale</CardTitle>
          <CardDescription>
            Modifica i parametri direttamente in forma visuale, con ricerca e accordion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminExamsEditor
            initialValues={value as Record<string, { price: number; urgencyTiming: string; routineTiming: string; routineMinutes: number; normalFinding: string }>}
            saveAction={saveExamValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}

