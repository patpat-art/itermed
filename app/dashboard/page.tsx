import Link from "next/link";
import { Play, Sparkles, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { HomeRadarClient } from "./components/HomeRadarClient";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/require-user";

const radarData = [
  { metric: "Accuratezza Clinica", score: 82 },
  { metric: "Legal Compliance", score: 76 },
  { metric: "Appropriatezza", score: 71 },
  { metric: "Sostenibilità", score: 64 },
  { metric: "Empatia", score: 87 },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();

  const sessions = await prisma.sessionReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { case: true },
    take: 50,
  });

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const sessionsThisWeek = sessions.filter((s) => s.createdAt >= startOfWeek);
  const casesThisWeek = sessionsThisWeek.length;

  const iterMedScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / sessions.length,
        )
      : null;

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const daysWithCases = new Set(sessions.map((s) => dayKey(s.createdAt)));
  let streakDays = 0;
  for (let offset = 0; offset < 30; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    if (daysWithCases.has(dayKey(d))) {
      streakDays += 1;
    } else {
      if (offset === 0) {
        continue;
      }
      break;
    }
  }

  const recentCases = sessions.slice(0, 3).map((s) => ({
    sessionId: s.id,
    caseId: s.caseId,
    title: s.case.title,
    specialty: s.case.specialty ?? "Specialità non specificata",
    difficulty: s.case.difficulty,
    timestamp: s.createdAt.toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    score: Math.round(s.totalScore ?? 0),
  }));

  return (
    <div className="flex h-full flex-col gap-1">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 shrink-0">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-950">
            Bentornato{user.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-sm md:text-base text-zinc-600 max-w-2xl">
            Hai completato{" "}
            <span className="font-semibold text-zinc-900">
              {casesThisWeek} {casesThisWeek === 1 ? "caso" : "casi"}
            </span>{" "}
            questa settimana. Il tuo focus attuale è migliorare la{" "}
            <span className="font-semibold text-zinc-900">Sostenibilità Economica</span>.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200">
              IterMed Score: {iterMedScore ?? "N/D"}
            </Badge>
            <Badge variant="warning">Focus: Economia</Badge>
            <Badge variant="success">
              Streak: {streakDays} {streakDays === 1 ? "giorno" : "giorni"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/simulator">
            <Button variant="secondary" size="lg" className="shadow-sm">
              <Sparkles className="h-4 w-4" />
              Hub simulatore
            </Button>
          </Link>
          <Link href="/case/demo">
            <Button size="lg" className="shadow-sm">
              <Play className="h-4 w-4" />
              Avvia Caso Casuale
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-3">
        <Card className="bg-white/80 border-zinc-200/80 h-80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Profilo competenze</CardTitle>
            <CardDescription>
              Spider chart sulle 5 dimensioni IterMed (0–100).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-1 pb-4 h-48 md:h-56 flex items-center justify-center">
            <HomeRadarClient data={radarData} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/80 border-zinc-200/80 h-80">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-950">Quick start</CardTitle>
              <CardDescription>
                Avvia una simulazione in un click, o continua il percorso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/case/demo" className="block">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-950 text-zinc-50 px-5 py-4 shadow-sm hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold tracking-tight">Avvia Caso Casuale</p>
                      <p className="text-xs text-zinc-300">
                        Caso demo ottimizzato per allenare decisioni e documentazione difendibile.
                      </p>
                    </div>
                    <Play className="h-5 w-5" />
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Target className="h-4 w-4 text-zinc-600" />
                    <span>Focus</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-950">Economia</p>
                  <p className="text-xs text-zinc-500">Riduci esami ridondanti</p>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Calendar className="h-4 w-4 text-zinc-600" />
                    <span>Settimana</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-950">
                    {casesThisWeek} {casesThisWeek === 1 ? "caso" : "casi"}
                  </p>
                  <p className="text-xs text-zinc-500">Attività negli ultimi 7 giorni</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="-mt-6 shrink-0">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-medium text-zinc-950">Ultimi casi affrontati</CardTitle>
              <CardDescription>
                Storico sintetico degli ultimi 3 report salvati.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="max-h-40 md:max-h-44 overflow-y-auto">
            <div className="divide-y divide-zinc-200/80 text-sm">
              {recentCases.map((item) => (
                <Link
                  key={item.sessionId}
                  href={`/case/${item.caseId}/results?sessionId=${item.sessionId}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-100 rounded-2xl px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-950">
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.specialty} · Difficoltà: {item.difficulty}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-zinc-500">{item.timestamp}</span>
                      <span className="text-xs text-zinc-400">Score complessivo</span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-50 text-xs font-semibold">
                      {item.score}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

