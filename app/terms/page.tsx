import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata = {
  title: "Termini di servizio · Aequan",
  description:
    "Termini di servizio di Aequan — Titolare Christopher Uguzzoni, Pavullo nel Frignano (MO).",
};

/**
 * Termini di servizio definitivi.
 * Titolare: Christopher Uguzzoni — CF GZZCRS01T12G393M — chris01.ugo@gmail.com
 */
export default function TermsPage() {
  return (
    <LegalPageShell title="Termini di servizio" lastUpdated="20 luglio 2026">
      <LegalSection title="1. Oggetto del servizio e Titolare">
        <p>
          Aequan (di seguito &quot;la Piattaforma&quot;) è un ambiente digitale di{" "}
          <strong>formazione e simulazione clinica e medico-legale</strong> destinato a studenti di
          medicina e professionisti sanitari che abbiano compiuto 18 anni. L&apos;accesso e
          l&apos;uso della Piattaforma presuppongono l&apos;accettazione integrale dei presenti
          Termini.
        </p>
        <p>
          Il <strong>Titolare del Servizio</strong> — anche per fatturazione, adempimenti fiscali e
          richieste commerciali, fino a eventuale aggiornamento con diversa entità societaria — è{" "}
          <strong>Christopher Uguzzoni</strong>, con residenza / sede legale in{" "}
          <strong>Pavullo nel Frignano (MO), Italia</strong>, Codice Fiscale{" "}
          <strong>GZZCRS01T12G393M</strong>. Email ufficiale:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>
          . Foro competente: <strong>Tribunale di Modena</strong>.
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
              I contenuti, le simulazioni, i punteggi e i report generati (anche tramite
              intelligenza artificiale) <strong>non sostituiscono</strong> il giudizio clinico di un
              medico abilitato, le linee guida ufficiali né le procedure del proprio ente.
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
          <Link
            href="/privacy"
            className="font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          . L&apos;utente è responsabile della riservatezza delle credenziali. La registrazione è
          consentita esclusivamente a soggetti che abbiano compiuto{" "}
          <strong>18 (diciotto) anni</strong>.
        </p>
      </LegalSection>

      <LegalSection title="4. Proprietà intellettuale">
        <p>
          L&apos;intera architettura software, il database dei casi clinici, gli algoritmi Aequan, i
          materiali del simulatore, i marchi, i loghi, i testi formativi e ogni altro contenuto
          predefinito della Piattaforma appartengono in via{" "}
          <strong>esclusiva a Christopher Uguzzoni</strong>.
        </p>
        <p>
          È vietato riprodurre, distribuire, modificare, estrarre, pubblicare o sfruttare
          commercialmente tali materiali senza previa autorizzazione scritta del Titolare.
          L&apos;utente conserva diritti solo sulle proprie{" "}
          <strong>metriche di performance personali</strong> (punteggi, report di sessione,
          progressi formativi). Gli output generati da modelli di intelligenza artificiale restano
          strumenti formativi interni e non attribuiscono all&apos;utente diritti di proprietà
          sull&apos;architettura, sugli algoritmi o sul corpus clinico di Aequan.
        </p>
      </LegalSection>

      <LegalSection title="5. Piani a Pagamento, Abbonamenti e Diritto di Recesso">
        <p>
          Alcune funzionalità di Aequan possono essere offerte mediante{" "}
          <strong>piani a pagamento o abbonamenti</strong> (SaaS). I pagamenti sono elaborati in
          modo sicuro tramite <strong>Stripe</strong>. I prezzi sono indicati in{" "}
          <strong>Euro (€)</strong> e, salvo diversa indicazione esplicita in fase di checkout,
          si intendono comprensivi delle imposte applicabili.
        </p>
        <p>
          <strong>Diritto di recesso (14 giorni)</strong> — In conformità alla Direttiva UE
          2011/83/UE e alla normativa italiana di recepimento, il consumatore ha diritto di
          recedere dall&apos;acquisto di un abbonamento entro <strong>14 (quattordici) giorni</strong>{" "}
          dalla conclusione del contratto, senza obbligo di fornire motivazioni, con diritto al
          rimborso integrale tramite Stripe, salve le eccezioni di seguito.
        </p>
        <p>
          <strong>Esecuzione immediata del servizio digitale</strong> — Se l&apos;utente richiede
          espressamente e inizia l&apos;accesso immediato ai contenuti digitali / simulazioni durante
          il periodo di recesso, riconosce che, ai sensi della normativa UE: (i) il diritto di
          recesso può essere esercitato in misura proporzionale all&apos;uso già effettuato del
          servizio, oppure (ii) può venir meno una volta che l&apos;esecuzione del servizio digitale
          è pienamente iniziata con il consenso informato dell&apos;utente, secondo quanto previsto
          dalla legge.
        </p>
        <p>
          <strong>Disdetta e rinnovo automatico</strong> — Gli abbonamenti possono rinnovarsi
          automaticamente al termine di ciascun ciclo di fatturazione. L&apos;utente può disattivare
          il rinnovo automatico in qualsiasi momento prima del successivo addebito, dal{" "}
          <strong>dashboard del proprio account</strong> oppure tramite il{" "}
          <strong>Stripe Customer Portal</strong>. La disdetta del rinnovo non comporta di per sé
          il rimborso del periodo già pagato e non ancora scaduto, salvo quanto dovuto in caso di
          legittimo esercizio del diritto di recesso.
        </p>
        <p>
          Per fatturazione, rimborsi e questioni fiscali relative ai piani a pagamento:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>{" "}
          (Titolare: Christopher Uguzzoni, CF GZZCRS01T12G393M).
        </p>
      </LegalSection>

      <LegalSection title="6. Limitazione di responsabilità">
        <p>
          Nei limiti consentiti dalla legge applicabile, Christopher Uguzzoni non risponde di danni
          derivanti dall&apos;uso improprio di Aequan, da interruzioni del servizio o da
          errori/omissioni nei contenuti formativi o nei report automatici.
        </p>
      </LegalSection>

      <LegalSection title="7. Legge applicabile e Foro competente">
        <p>
          I presenti Termini sono regolati dalla <strong>legge italiana</strong> e dalla normativa
          dell&apos;Unione Europea in materia di protezione dei dati personali (
          <strong>GDPR</strong> — Regolamento UE 2016/679) e di tutela del consumatore (ivi inclusa
          la Direttiva 2011/83/UE), ove applicabile.
        </p>
        <p>
          Per ogni controversia derivante da o connessa all&apos;uso della Piattaforma o ai presenti
          Termini è competente in via <strong>esclusiva</strong> il{" "}
          <strong>Tribunale di Modena</strong> (Foro di Modena), fatto salvo quanto
          obbligatoriamente previsto dalla legge a tutela del consumatore, ove applicabile.
        </p>
      </LegalSection>

      <LegalSection title="8. Contatti">
        <p>
          Per qualsiasi richiesta relativa ai presenti Termini, alla fatturazione o agli
          abbonamenti scrivere a:{" "}
          <a
            href="mailto:chris01.ugo@gmail.com"
            className="font-mono text-xs font-medium text-[#1E324E] underline-offset-2 hover:underline"
          >
            chris01.ugo@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Minori">
        <p>
          La Piattaforma è destinata esclusivamente a studenti di medicina e professionisti
          sanitari maggiorenni. L&apos;età minima richiesta è di <strong>18 anni</strong>. Non è
          consentita la registrazione o l&apos;uso da parte di minori.
        </p>
      </LegalSection>

      <LegalSection title="10. Conformità EU AI Act (Reg. UE 2024/1689) & Limiti del Modello">
        <p>
          In conformità agli obblighi di <strong>trasparenza</strong> (art. 50) e di promozione della{" "}
          <strong>AI literacy</strong> (art. 4) del Regolamento (UE) 2024/1689 (AI Act), Aequan
          informa gli utenti quanto segue.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Aequan utilizza <strong>Large Language Models (LLM)</strong> esclusivamente per la
            simulazione medica didattica e per lo scoring / report formativo.
          </li>
          <li>
            Gli output dell&apos;IA sono <strong>non deterministici</strong> e possono presentare
            allucinazioni o inesattezze. L&apos;utente deve sempre confrontare i risultati con le
            linee guida cliniche ufficiali basate su Evidence-Based Medicine (EBM) e con il proprio
            giudizio professionale.
          </li>
          <li>
            È <strong>rigorosamente vietato</strong> inserire nelle interfacce di prompt AI dati di
            pazienti reali, Protected Health Information (PHI) o altri dati personali sanitari di
            soggetti identificabili. La Piattaforma è destinata solo a scenari simulati.
          </li>
        </ul>
      </LegalSection>
    </LegalPageShell>
  );
}
