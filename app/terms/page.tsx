import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata = {
  title: "Termini di servizio · Aequan",
  description:
    "Termini di servizio e disclaimer medico di Aequan — piattaforma educativa di simulazione clinica.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Termini di servizio" lastUpdated="20 luglio 2026">
      <LegalSection title="1. Oggetto del servizio">
        <p>
          Aequan (di seguito anche &quot;la Piattaforma&quot;) è un ambiente digitale di{" "}
          <strong>formazione e simulazione clinica e medico-legale</strong> destinato a studenti,
          specializzandi e professionisti sanitari. L&apos;accesso e l&apos;uso della Piattaforma
          presuppongono l&apos;accettazione integrale dei presenti Termini.
        </p>
        <p>
          [PLACEHOLDER — Inserire ragione sociale, sede legale, P. IVA / CF e recapiti del
          Titolare del servizio.]
        </p>
      </LegalSection>

      <LegalSection title="2. Disclaimer medico — uso esclusivamente educativo">
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-rose-950">
          <p className="font-semibold">Avvertenza importante</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Aequan è uno strumento <strong>puramente educativo e formativo</strong>. Non è un
              dispositivo medico (né MDR né FDA), non è software clinico certificato e non fornisce
              diagnosi, terapie o consulenza sanitaria.
            </li>
            <li>
              I contenuti, le simulazioni, i punteggi e i report generati (anche tramite intelligenza
              artificiale) <strong>non sostituiscono</strong> il giudizio clinico di un medico
              abilitato, le linee guida ufficiali né le procedure del proprio ente.
            </li>
            <li>
              È vietato utilizzare Aequan per prendere decisioni su pazienti reali, per attività
              assistenziali o per qualsiasi scopo diverso dalla formazione simulata.
            </li>
            <li>
              L&apos;utente è l&apos;unico responsabile dell&apos;uso dei contenuti al di fuori del
              contesto formativo simulato.
            </li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection title="3. Account e registrazione">
        <p>
          Per utilizzare alcune funzionalità è necessario creare un account fornendo dati veritieri
          e accettando i presenti Termini e la{" "}
          <Link href="/privacy" className="font-medium text-[#1E324E] underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          . L&apos;utente è responsabile della riservatezza delle credenziali.
        </p>
      </LegalSection>

      <LegalSection title="4. Proprietà intellettuale e contenuti generati">
        <p>
          [PLACEHOLDER — Disciplina su marchi, software, casi clinici, materiali caricati dagli utenti
          e output generati da modelli di intelligenza artificiale.]
        </p>
      </LegalSection>

      <LegalSection title="5. Limitazione di responsabilità">
        <p>
          Nei limiti consentiti dalla legge applicabile, Aequan e i suoi operatori non rispondono di
          danni derivanti dall&apos;uso improprio della Piattaforma, da interruzioni del servizio o da
          errori/omissioni nei contenuti formativi o nei report automatici.
        </p>
      </LegalSection>

      <LegalSection title="6. Legge applicabile">
        <p>
          [PLACEHOLDER — Indicare legge e foro competente, tipicamente Italia / UE per utenti
          consumatori e professionisti.]
        </p>
      </LegalSection>

      <LegalSection title="7. Contatti">
        <p>
          Per richieste relative ai presenti Termini:{" "}
          <span className="font-mono text-xs">[legal@example.com]</span>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
