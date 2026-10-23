import ScrollToTop from "@/components/ScrollToTop";

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <ScrollToTop />
      <div className="mx-auto max-w-4xl px-6 py-20">
        <a href="/" className="text-sm text-cyan-300 transition hover:text-cyan-200">
          ← Zurück zur Startseite
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-4xl font-bold">Datenschutzerklärung</h1>

          <div className="mt-8 space-y-8 text-slate-300 leading-7">

            <section>
              <h2 className="text-xl font-semibold text-white">1. Verantwortlicher</h2>
              <p className="mt-3">
                <strong className="text-white">Dukart Systems</strong><br />
                David Dukart<br />
                Im Sonneneck 12<br />
                68642 Bürstadt<br />
                Deutschland<br />
                E-Mail: kontakt@dukartsystems.de<br />
                Telefon: +49 162 7263133
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Allgemeine Hinweise</h2>
              <p className="mt-3">
                Der Schutz Ihrer persönlichen Daten ist uns wichtig. Wir verarbeiten Ihre Daten vertraulich
                und entsprechend der Datenschutz-Grundverordnung (DSGVO) sowie dieser Datenschutzerklärung.
                Die Nutzung unserer Webseite ist grundsätzlich ohne Angabe personenbezogener Daten möglich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Erhobene Daten und Zwecke</h2>

              <h3 className="text-base font-semibold text-slate-200 mt-5">3.1 Besuchsstatistik</h3>
              <p className="mt-2">
                Beim Aufruf unserer Webseite speichern wir serverseitig die IP-Adresse des Besuchers,
                den verwendeten Browser (User-Agent), die Herkunftsseite (Referrer) sowie den Zeitpunkt
                des Besuchs. Diese Daten werden ausschließlich zur Auswertung der Besucherzahlen verwendet
                und nicht an Dritte weitergegeben. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse an der Analyse der Webseitennutzung).
              </p>

              <h3 className="text-base font-semibold text-slate-200 mt-5">3.2 Kontaktformular</h3>
              <p className="mt-2">
                Wenn Sie unser Kontaktformular nutzen, erheben wir Ihren Namen, Ihre Kontaktdaten
                (E-Mail-Adresse oder Telefonnummer), optional Ihre Telefonnummer, den Betreff sowie
                Ihre Nachricht. Diese Daten werden verwendet, um Ihre Anfrage zu bearbeiten und
                ggf. ein Angebot zu erstellen. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
                (vorvertragliche Maßnahmen).
              </p>

              <h3 className="text-base font-semibold text-slate-200 mt-5">3.3 Kundenportal</h3>
              <p className="mt-2">
                Im Rahmen der Nutzung unseres Kundenportals verarbeiten wir folgende Daten:
                Vor- und Nachname, E-Mail-Adresse, Telefonnummer, Anschrift sowie auftragsbezogene
                Daten (Auftragsnummer, Status, Komponenten, Preis, Dokumente). Diese Daten sind
                zur Vertragserfüllung erforderlich. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
              </p>
              <p className="mt-2">
                Der Zugang zum Kundenportal erfolgt ausschließlich per persönlicher Einladung.
                Passwörter werden verschlüsselt (gehasht) gespeichert.
              </p>

              <h3 className="text-base font-semibold text-slate-200 mt-5">3.4 Chat-Nachrichten</h3>
              <p className="mt-2">
                Nachrichten, die über den Live-Chat im Kundenportal gesendet werden, werden
                auftragsbezogen gespeichert und sind ausschließlich für Sie und unser Team einsehbar.
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
              </p>

              <h3 className="text-base font-semibold text-slate-200 mt-5">3.5 Rechnungen und Angebote</h3>
              <p className="mt-2">
                Im Rahmen der Auftragsabwicklung erstellen wir Rechnungen und Angebote, die Ihren
                Namen, Ihre Adresse sowie auftragsbezogene Daten enthalten. Diese Dokumente werden
                gespeichert und Ihnen im Kundenportal zur Verfügung gestellt.
                Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Aufbewahrungspflicht),
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Speicherdauer</h2>
              <p className="mt-3">
                Kontaktanfragen werden nach abgeschlossener Bearbeitung gelöscht, sofern keine
                gesetzliche Aufbewahrungspflicht besteht. Auftragsdaten und Rechnungen unterliegen
                den handels- und steuerrechtlichen Aufbewahrungsfristen (in der Regel 10 Jahre).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Weitergabe an Dritte</h2>
              <p className="mt-3">
                Ihre personenbezogenen Daten werden nicht an Dritte weitergegeben, verkauft oder
                für Werbezwecke genutzt. Eine Übermittlung an Behörden erfolgt nur, wenn wir
                gesetzlich dazu verpflichtet sind.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
              <p className="mt-3">
                Unsere Webseite verwendet ausschließlich technisch notwendige Session-Cookies für
                den Login-Bereich. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. SSL-Verschlüsselung</h2>
              <p className="mt-3">
                Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung.
                Eine verschlüsselte Verbindung erkennen Sie an dem „https://" in der Adresszeile
                Ihres Browsers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Ihre Rechte</h2>
              <p className="mt-3">Sie haben das Recht auf:</p>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              </ul>
              <p className="mt-3">
                Zur Ausübung dieser Rechte wenden Sie sich bitte an:{" "}
                <a href="mailto:kontakt@dukartsystems.de" className="text-cyan-300 hover:text-cyan-200 transition">
                  kontakt@dukartsystems.de
                </a>
              </p>
              <p className="mt-2">
                Sie haben zudem das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde
                zu beschweren. Die zuständige Behörde für Hessen ist der{" "}
                <a href="https://datenschutz.hessen.de" className="text-cyan-300 hover:text-cyan-200 transition" target="_blank" rel="noopener noreferrer">
                  Hessische Beauftragte für Datenschutz und Informationsfreiheit
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. Aktualität dieser Erklärung</h2>
              <p className="mt-3">
                Diese Datenschutzerklärung ist aktuell gültig (Stand: Mai 2026).
                Wir behalten uns vor, diese bei Bedarf zu aktualisieren.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
