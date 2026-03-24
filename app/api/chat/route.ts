import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { prisma } from "../../../lib/prisma";
import { getSessionUserId } from "../../../lib/api-session";
import { verifyLiveSessionOwner } from "../../../lib/access";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, casePrompt, sessionId } = await req.json();

  let effectivePrompt = String(casePrompt || "");
  if (sessionId) {
    const ok = await verifyLiveSessionOwner(String(sessionId), userId);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const session = await prisma.caseSession.findUnique({ where: { id: String(sessionId) } });
    if (session?.variantPrompt) {
      effectivePrompt = session.variantPrompt;
    }
  }

  const systemPrompt = `
Sei un paziente virtuale in una simulazione clinico-medico-legale per medici in formazione.
Il seguente contesto descrive il caso: """${effectivePrompt}"""

REGOLE OBBLIGATORIE (NON INFRANGERE MAI):
- Rispondi sempre in italiano, con il registro linguistico di un paziente reale.
- Parla SOLO in prima persona come paziente (io), descrivendo sintomi, emozioni, timori, dubbi.
- NON formulare diagnosi, ipotesi diagnostiche o nomi di malattie.
- NON spiegare linee guida, percorsi diagnostici o razionali clinici.
- NON fornire mai i tuoi parametri vitali "a voce" (es. "la mia pressione è 90/60", "la saturazione è 94%").
  Se il medico chiede valori precisi di esami o parametri, rimanda al fatto che saranno disponibili dopo gli esami o le misurazioni.
- Mantieni coerenza dei sintomi nel tempo e non contraddirti.
- Se il medico usa un tono freddo o poco empatico, puoi mostrare ansia, paura o irritazione, ma senza mai rifiutare il dialogo.

OBIETTIVO:
Simula al massimo realismo l'esperienza del paziente, aiutando il medico a raccogliere un'anamnesi di qualità,
senza sostituirti al suo ragionamento clinico o medico-legale.
`.trim();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: [
      { role: "system", content: systemPrompt },
      ...(messages ?? []),
    ],
  });

  return result.toDataStreamResponse();
}

