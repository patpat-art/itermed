import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata = {
  title: "Privacy Policy · Aequan",
  description:
    "Informativa privacy GDPR di Aequan — trattamento dei dati personali degli utenti della piattaforma.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy (GDPR)" lastUpdated="20 luglio 2026">
      <LegalSection title="1. Titolare del trattamento">
        <p>
          Il <strong>Titolare del trattamento</strong> dei dati personali è{" "}
          <strong>Christopher Uguzzoni</strong>, con sede / residenza in{" "}
          <strong>Pavullo nel Frignano (MO), Italia</strong>, Codice Fiscale{" "}
          <strong>GZZCRS01T12G393M</strong>.
        </p>
        <p>
          Contatto per privacy e esercizio dei diritti:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>
          . Al momento non è stato nominato un Responsabile della protezione dei dati (DPO).
        </p>
      </LegalSection>

      <LegalSection title="2. Tipologie di dati trattati">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Dati di account: email, nome (opzionale), hash della password.</li>
          <li>
            Dati di accettazione legale: timestamp di accettazione dei Termini (
            <code className="text-[11px]">termsAcceptedAt</code>) e della Privacy Policy (
            <code className="text-[11px]">privacyAcceptedAt</code>).
          </li>
          <li>
            Dati di utilizzo: sessioni di simulazione, report formativi, preferenze (es. classifica).
          </li>
          <li>
            Dati di pagamento/abbonamento (se attivati): identificativi Stripe e stato sottoscrizione.
          </li>
          <li>
            Dati tecnici: log di sicurezza, indirizzo IP (ove necessario per rate-limiting e
            prevenzione abusi), cookie/sessioni di autenticazione.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalità e basi giuridiche (art. 6 GDPR)">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Esecuzione del contratto</strong> — creazione account, erogazione della
            simulazione formativa, assistenza.
          </li>
          <li>
            <strong>Obbligo legale</strong> — adempimenti fiscali/contabili ove applicabili.
          </li>
          <li>
            <strong>Legittimo interesse</strong> — sicurezza della piattaforma, prevenzione frodi,
            miglioramento del servizio (nel rispetto dei diritti dell&apos;interessato).
          </li>
          <li>
            <strong>Consenso</strong> — ove richiesto (es. cookie non necessari, comunicazioni di
            marketing). Il consenso può essere revocato in qualsiasi momento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Destinatari e trasferimenti">
        <p>
          I dati possono essere trattati, per conto del Titolare e nei limiti delle finalità
          indicate, da fornitori di servizi tecnici indispensabili all&apos;erogazione della
          Piattaforma, tra cui: hosting e infrastruttura cloud, database (Neon), servizi di
          autenticazione, elaborazione pagamenti (Stripe, se attivata), modelli e infrastrutture
          AI (es. OpenAI, Pinecone) per le funzionalità di simulazione e recupero documentale.
        </p>
        <p>
          Ove un trattamento comporti trasferimento di dati personali al di fuori dello Spazio
          Economico Europeo, il Titolare adotta garanzie adeguate ai sensi del GDPR (decisioni di
          adeguatezza della Commissione europea, Clausole Contrattuali Standard o misure
          equivalenti).
        </p>
      </LegalSection>

      <LegalSection title="5. Periodo di conservazione">
        <p>
          I dati dell&apos;account sono conservati per la durata del rapporto e, dopo la
          cancellazione, per il tempo necessario ad obblighi di legge o difesa in giudizio.
          I timestamp di accettazione legale sono conservati a fini di prova del consenso.
        </p>
      </LegalSection>

      <LegalSection title="6. Diritti dell&apos;interessato (artt. 15–22 GDPR)">
        <p>
          L&apos;utente può esercitare accesso, rettifica, cancellazione, limitazione, portabilità,
          opposizione e revoca del consenso contattando il Titolare. Ha inoltre diritto di proporre
          reclamo all&apos;Autorità Garante per la protezione dei dati personali.
        </p>
        <p>
          Contatto privacy:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="7. Sicurezza">
        <p>
          Adottiamo misure tecniche e organizzative adeguate (hash delle password, controlli di
          accesso, rate limiting). Nessun sistema è immune al rischio: ti invitiamo a usare
          password robuste e uniche.
        </p>
      </LegalSection>

      <LegalSection title="8. Minori">
        <p>
          La Piattaforma è destinata esclusivamente a{" "}
          <strong>studenti di medicina e professionisti sanitari</strong> che abbiano compiuto{" "}
          <strong>18 anni</strong>. Non raccogliamo consapevolmente dati di minori di 18 anni. Se
          venisse a conoscenza di un account creato da un minore, il Titolare provvederà alla
          cancellazione senza indebito ritardo.
        </p>
      </LegalSection>

      <LegalSection title="9. Aggiornamenti">
        <p>
          Questa informativa può essere aggiornata. La data in cima alla pagina indica la versione
          corrente. Per i Termini di servizio vedi{" "}
          <Link href="/terms" className="font-medium text-[#1E324E] underline-offset-2 hover:underline">
            /terms
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
