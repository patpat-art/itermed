import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

export default function DashboardSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-sm text-zinc-400">
          Impostazioni di base (UI pronta; preferenze avanzate in arrivo).
        </p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">AI & Privacy</CardTitle>
          <CardDescription>Controlli base (in arrivo).</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-zinc-700 space-y-2">
          <p>
            In futuro potrai scegliere modello, modalità RAG e policy di logging. Per ora le chiamate AI usano <span className="font-mono">OPENAI_API_KEY</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

