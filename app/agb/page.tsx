import ScrollToTop from "@/components/ScrollToTop";

export default function AgbPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <ScrollToTop />
      <div className="mx-auto max-w-4xl px-6 py-20">
        <a href="/" className="text-sm text-cyan-300 transition hover:text-cyan-200">
          ← Zurück zur Startseite
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-4xl font-bold">Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p className="mt-3 text-slate-400 text-sm">Stand: Mai 2026</p>

          <div className="mt-8 space-y-8 text-slate-300 leading-7">

            <section>
              <h2 className="text-xl font-semibold text-white">§ 1 Geltungsbereich</h2>
              <p className="mt-3">
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen
              </p>
              <p className="mt-3">
                <strong className="text-white">Dukart Systems</strong><br />
                David Dukart<br />
                Im Sonneneck 12, 68642 Bürstadt<br />
                E-Mail: kontakt@dukartsystems.de<br />
                Telefon: +49 162 7263133
              </p>
              <p className="mt-3">
                (nachfolgend „Dukart Systems" oder „wir") und unseren Kunden (nachfolgend „Kunde")
                über die Erbringung von IT-Dienstleistungen, PC-Reparaturen, PC-Aufbau sowie
                verwandter Leistungen.
              </p>
              <p className="mt-3">
                Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, wir stimmen
                ihrer Geltung ausdrücklich schriftlich zu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 2 Vertragssprache und Speicherung des Vertragstexts</h2>
              <p className="mt-3">
                Die für den Vertragsschluss zur Verfügung stehende Sprache ist ausschließlich
                <strong className="text-white"> Deutsch</strong>.
              </p>
              <p className="mt-3">
                Nach Vertragsschluss wird der Vertragstext von uns gespeichert. Kunden können alle
                Auftrags- und Vertragsdaten jederzeit über ihr persönliches{" "}
                <a href="/kundenportal" className="text-cyan-300 hover:text-cyan-200 transition">Kundenportal</a>{" "}
                einsehen. Zusätzlich wird eine Auftragsbestätigung per E-Mail zugesendet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 3 Vertragsschluss</h2>
              <p className="mt-3">
                Der Vertrag kommt zustande, wenn der Kunde über das Kontaktformular auf unserer
                Website eine Anfrage stellt und wir diese schriftlich (per E-Mail oder über das
                Kundenportal) bestätigen. Mit der Bestätigung durch uns entsteht ein verbindlicher
                Auftrag.
              </p>
              <p className="mt-3">
                Die Darstellung unserer Leistungen auf der Website stellt kein bindendes Angebot,
                sondern eine Aufforderung zur Anfrage (invitatio ad offerendum) dar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 4 Widerrufsrecht für Verbraucher</h2>
              <p className="mt-3">
                Wenn Sie Verbraucher im Sinne des § 13 BGB sind, steht Ihnen ein gesetzliches
                Widerrufsrecht zu. Alle Informationen zu Ihrem Widerrufsrecht sowie das
                Muster-Widerrufsformular finden Sie in unserer{" "}
                <a href="/widerruf" className="text-cyan-300 hover:text-cyan-200 transition">
                  Widerrufsbelehrung
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 5 Leistungsumfang</h2>
              <p className="mt-3">
                Der genaue Leistungsumfang ergibt sich aus der jeweiligen Auftragsbestätigung.
                Wir erbringen unsere Leistungen nach bestem Wissen und Gewissen sowie nach dem
                aktuellen Stand der Technik.
              </p>
              <p className="mt-3">
                Änderungen am vereinbarten Leistungsumfang bedürfen der schriftlichen Zustimmung
                beider Parteien. Mehrleistungen werden gesondert berechnet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 6 Preise und Zahlungsbedingungen</h2>
              <p className="mt-3">
                Alle angegebenen Preise verstehen sich als Nettopreise. Da wir die
                Kleinunternehmerregelung gemäß § 19 UStG anwenden, wird keine Umsatzsteuer
                ausgewiesen.
              </p>
              <p className="mt-3">
                Rechnungen sind innerhalb von 14 Tagen nach Rechnungsdatum ohne Abzug zu begleichen,
                sofern im Einzelfall nichts anderes vereinbart wurde. Bei Zahlungsverzug sind wir
                berechtigt, Verzugszinsen in gesetzlicher Höhe (§ 288 BGB) zu berechnen.
              </p>
              <p className="mt-3">
                Bei Aufträgen ab 200 € sind wir berechtigt, eine Anzahlung von bis zu 50 % des
                Auftragswertes zu verlangen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 7 Mitwirkungspflichten des Kunden</h2>
              <p className="mt-3">
                Der Kunde ist verpflichtet, uns alle für die Leistungserbringung notwendigen
                Informationen, Zugänge und Unterlagen rechtzeitig zur Verfügung zu stellen.
              </p>
              <p className="mt-3">
                Der Kunde ist selbst für die Sicherung seiner Daten (Backup) verantwortlich.
                Wir übernehmen keine Haftung für Datenverluste, die im Rahmen unserer
                Leistungserbringung entstehen, sofern der Kunde keine ausreichende Datensicherung
                vorgenommen hat.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 8 Gewährleistung</h2>
              <p className="mt-3">
                Für erbrachte Dienstleistungen gilt eine Gewährleistungsfrist von 12 Monaten ab
                Leistungserbringung. Für eingebaute Hardware-Komponenten gilt die gesetzliche
                Gewährleistungsfrist von 24 Monaten.
              </p>
              <p className="mt-3">
                Mängel sind uns unverzüglich nach Feststellung schriftlich (per E-Mail oder über
                das Kundenportal) anzuzeigen. Wir haben das Recht zur Nacherfüllung (Nachbesserung
                oder Ersatzlieferung).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 9 Haftungsbeschränkung</h2>
              <p className="mt-3">
                Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers
                oder der Gesundheit sowie für vorsätzliche und grob fahrlässige Pflichtverletzungen.
              </p>
              <p className="mt-3">
                Im Übrigen ist unsere Haftung auf den vorhersehbaren, vertragstypischen Schaden
                begrenzt. Eine weitergehende Haftung ist ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 10 Stornierung und Rücktritt</h2>
              <p className="mt-3">
                Der Kunde kann einen bestätigten Auftrag bis zu 48 Stunden vor dem vereinbarten
                Termin kostenlos stornieren. Bei späterer Stornierung behalten wir uns vor,
                bereits angefallene Kosten (z.B. bestellte Hardware, Anfahrt) in Rechnung zu stellen.
              </p>
              <p className="mt-3">
                Wir behalten uns vor, Aufträge aus wichtigem Grund abzulehnen oder zu stornieren.
                In diesem Fall werden bereits geleistete Zahlungen vollständig erstattet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 11 Datenschutz</h2>
              <p className="mt-3">
                Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
                <a href="/datenschutz" className="text-cyan-300 hover:text-cyan-200 transition">
                  Datenschutzerklärung
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 12 Anzuwendendes Recht und Gerichtsstand</h2>
              <p className="mt-3">
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                Für Verbraucher mit gewöhnlichem Aufenthalt in einem anderen EU-Mitgliedstaat gelten
                zusätzlich die zwingenden Schutzvorschriften des jeweiligen Aufenthaltslandes.
              </p>
              <p className="mt-3">
                Für Verbraucher ist Gerichtsstand der allgemeine Gerichtsstand des Verbrauchers.
                Für Verträge mit Unternehmern ist ausschließlicher Gerichtsstand Bürstadt, sofern
                der Unternehmer keinen allgemeinen Gerichtsstand in Deutschland hat.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">§ 13 Salvatorische Klausel</h2>
              <p className="mt-3">
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
                Wirksamkeit der übrigen Bestimmungen unberührt. Die unwirksame Bestimmung wird
                durch eine wirksame ersetzt, die dem wirtschaftlichen Zweck der unwirksamen
                Bestimmung am nächsten kommt.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
