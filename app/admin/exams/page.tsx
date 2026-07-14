import { ExamsAdminPanel } from "@/components/exams/ExamsAdminPanel";
import { listDistinctExamCategories, listExamMetadata } from "@/lib/exams/exam-repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

export default async function AdminExamsPage() {
  const [exams, categories] = await Promise.all([
    listExamMetadata(),
    listDistinctExamCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Valori esami</h1>
        <p className="text-sm text-zinc-500">
          Catalogo enterprise con metadati in database, ricerca istantanea e validazione range.
        </p>
      </header>
      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm">Catalogo esami</CardTitle>
          <CardDescription>
            Modifica costi, tempi di refertazione e range fisiologici. Le modifiche si applicano
            immediatamente alla simulazione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamsAdminPanel initialExams={exams} initialCategories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
