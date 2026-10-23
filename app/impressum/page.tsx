import ScrollToTop from "@/components/ScrollToTop";

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <ScrollToTop />
      <div className="mx-auto max-w-4xl px-6 py-20">
        <a href="/" className="text-sm text-cyan-300 transition hover:text-cyan-200">
          ← Zurück zur Startseite
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-4xl font-bold">Impressum</h1>

          <div className="mt-8 space-y-8 text-slate-300 leading-7">

            <section>
              <h2 className="text-xl font-semibold text-white">Angaben gemäß § 5 TMG</h2>
              <p className="mt-3">
                <strong className="text-white">Dukart Systems</strong><br />
                David Dukart<br />
                Im Sonneneck 12<br />
                68642 Bürstadt<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Kontakt</h2>
              <p className="mt-3">
                Telefon: +49 162 7263133<br />
                E-Mail: kontakt@dukartsystems.de
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Unternehmensform</h2>
              <p className="mt-3">
                Kleingewerbe (Einzelunternehmen)<br />
                Gewerbeanmeldung beim Gewerbeamt Bürstadt
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Umsatzsteuer</h2>
              <p className="mt-3">
                Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
                Eine Umsatzsteuer-Identifikationsnummer liegt derzeit nicht vor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Verantwortlicher i.S.d. Presserechts / V.i.S.d.P. (§ 18 Abs. 2 MStV)</h2>
              <p className="mt-3">
                David Dukart<br />
                Im Sonneneck 12<br />
                68642 Bürstadt
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Streitschlichtung</h2>
              <p className="mt-3">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr/" className="text-cyan-300 hover:text-cyan-200 transition" target="_blank" rel="noopener noreferrer">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-2">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Haftung für Inhalte</h2>
              <p className="mt-3">
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
                zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Haftung für Links</h2>
              <p className="mt-3">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
                haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
                der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
