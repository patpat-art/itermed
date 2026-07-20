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
      <LegalSection title="1. Oggetto del servizio e Titolare">
        <p>
          Aequan (di seguito anche &quot;la Piattaforma&quot;) è un ambiente digitale di{" "}
          <strong>formazione e simulazione clinica e medico-legale</strong> destinato a studenti di
          medicina e professionisti sanitari maggiorenni. L&apos;accesso e l&apos;uso della
          Piattaforma presuppongono l&apos;accettazione integrale dei presenti Termini.
        </p>
        <p>
          Il <strong>Titolare del Servizio</strong> è <strong>Christopher Uguzzoni</strong>, con
          sede / residenza in <strong>Pavullo nel Frignano (MO), Italia</strong>, Codice Fiscale{" "}
          <strong>GZZCRS01T12G393M</strong>. Contatti:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>
          .
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
          . L&apos;utente è responsabile della riservatezza delle credenziali. La Piattaforma è
          riservata a persone che abbiano compiuto <strong>18 anni</strong>.
        </p>
      </LegalSection>

      <LegalSection title="4. Proprietà intellettuale e contenuti generati">
        <p>
          Tutti i diritti di proprietà intellettuale relativi alla Piattaforma — inclusa
          l&apos;architettura software, il database dei casi clinici, gli algoritmi Aequan, i
          materiali del simulatore, i marchi, i loghi, i testi formativi e ogni altro contenuto
          predefinito — appartengono in via <strong>esclusiva</strong> a{" "}
          <strong>Christopher Uguzzoni</strong>, salvo diversa indicazione espressa.
        </p>
        <p>
          È vietato riprodurre, distribuire, modificare, estrarre, pubblicare o sfruttare
          commercialmente tali materiali senza previa autorizzazione scritta del Titolare.
        </p>
        <p>
          L&apos;utente conserva i diritti sui propri dati personali e sulle{" "}
          <strong>metriche di performance personali</strong> generate dall&apos;uso della
          Piattaforma (punteggi, report di sessione, progressi formativi). Gli output generati da
          modelli di intelligenza artificiale nell&apos;ambito della simulazione restano strumenti
          formativi interni alla Piattaforma e non attribuiscono all&apos;utente diritti di
          proprietà sull&apos;architettura, sugli algoritmi o sul corpus clinico di Aequan.
        </p>
      </LegalSection>

      <LegalSection title="5. Limitazione di responsabilità">
        <p>
          Nei limiti consentiti dalla legge applicabile, Christopher Uguzzoni e gli operatori della
          Piattaforma non rispondono di danni derivanti dall&apos;uso improprio di Aequan, da
          interruzioni del servizio o da errori/omissioni nei contenuti formativi o nei report
          automatici.
        </p>
      </LegalSection>

      <LegalSection title="6. Legge applicabile e Foro competente">
        <p>
          I presenti Termini sono regolati dalla <strong>legge italiana</strong> e dalla normativa
          dell&apos;Unione Europea in materia di protezione dei dati personali (
          <strong>GDPR</strong> — Regolamento UE 2016/679), ove applicabile.
        </p>
        <p>
          Per ogni controversia derivante da o connessa all&apos;uso della Piattaforma o ai presenti
          Termini è competente in via <strong>esclusiva</strong> il{" "}
          <strong>Foro di Modena</strong> (Tribunale di Modena), fatto salvo quanto obbligatoriamente
          previsto dalla legge a tutela del consumatore, ove applicabile.
        </p>
      </LegalSection>

      <LegalSection title="7. Contatti">
        <p>
          Per richieste relative ai presenti Termini:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
