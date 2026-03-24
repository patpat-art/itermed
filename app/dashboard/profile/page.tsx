import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/require-user";

export default async function DashboardProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Profilo</h1>
        <p className="text-sm text-zinc-400">Dati account collegati alla sessione corrente.</p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Account</CardTitle>
          <CardDescription>Stato utente corrente.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-2">
          <p className="text-xs">
            Email: <span className="font-mono">{user?.email ?? "N/D"}</span>
          </p>
          <p className="text-xs">
            Nome: <span className="font-mono">{user?.name ?? "N/D"}</span>
          </p>
          <p className="text-xs">
            ID: <span className="font-mono">{user?.id ?? "N/D"}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

