import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { visibleCasesWhere } from "../../../lib/access";
import { requireUser } from "../../../lib/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";

export default async function DashboardSimulatorPage() {
  const user = await requireUser();
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  let cases:
    | {
        id: string;
        title: string;
        specialty: string | null;
        difficulty: string;
      }[]
    | null = null;

  if (hasDatabase) {
    try {
      const rows = await prisma.clinicalCase.findMany({
        where: visibleCasesWhere(user.id),
        orderBy: { updatedAt: "desc" },
        take: 12,
      });
      cases = rows;
    } catch {
      // se Prisma fallisce (db non pronto), restiamo sui casi demo
      cases = null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Simulatore</h1>
        <p className="text-sm text-zinc-400">
          Avvia rapidamente una simulazione scegliendo un caso
          {hasDatabase ? " dal database." : " (modalità demo senza database configurato)."}
        </p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Avvio rapido</CardTitle>
          <CardDescription>
            Usa un caso demo per verificare chat (LLM paziente), selezione esami, referto e valutazione finale.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-950">Caso demo: dolore toracico in PS</p>
            <p className="text-xs text-zinc-500">
              Consigliato per verificare che tutto l&apos;stack (API + DB) sia operativo.
            </p>
          </div>
          <Link
            href="/case/demo"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 text-zinc-50 px-4 py-2 text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            Apri simulatore
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Scegli un caso</CardTitle>
          <CardDescription>Elenco casi attivi disponibili.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="divide-y divide-zinc-200/80">
            {(cases ??
              [
                {
                  id: "demo",
                  title: "Scenario demo PS – dolore toracico",
                  specialty: "Emergenza / Cardiologia",
                  difficulty: "MEDIUM",
                },
                {
                  id: "cs_001",
                  title: "Dolore toracico in PS",
                  specialty: "Emergenza",
                  difficulty: "MEDIUM",
                },
                {
                  id: "cs_002",
                  title: "Febbre persistente in paziente anziano",
                  specialty: "Medicina interna",
                  difficulty: "EASY",
                },
              ]
            ).map((c) => (
              <Link
                key={c.id}
                href={`/case/${c.id}`}
                className="flex items-center justify-between gap-4 py-3 rounded-2xl px-2 -mx-2 hover:bg-zinc-100 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-950">{c.title}</p>
                  <p className="text-xs text-zinc-500">{c.specialty ?? "Specialità N/D"}</p>
                </div>
                <Badge className="shrink-0">
                  {String(c.difficulty)}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

