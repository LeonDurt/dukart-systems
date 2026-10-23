import ScrollToTop from "@/components/ScrollToTop";
import WiderrufForm from "@/components/WiderrufForm";

export default function WiderrufPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <ScrollToTop />
      <div className="mx-auto max-w-4xl px-6 py-20">
        <a href="/" className="text-sm text-cyan-300 transition hover:text-cyan-200">
          ← Zurück zur Startseite
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-4xl font-bold">Widerrufsbelehrung</h1>
          <p className="mt-3 text-slate-400 text-sm">Stand: Mai 2026</p>

          <div className="mt-8 space-y-8 text-slate-300 leading-7">

            <section>
              <h2 className="text-xl font-semibold text-white">Widerrufsrecht</h2>
              <p className="mt-3">
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag
                zu widerrufen.
              </p>
              <p className="mt-3">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="mt-3">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
              </p>
              <p className="mt-4 pl-4 border-l border-white/20">
                <strong className="text-white">Dukart Systems, David Dukart</strong><br />
                Im Sonneneck 12, 68642 Bürstadt<br />
                E-Mail:{" "}
                <a href="mailto:kontakt@dukartsystems.de" className="text-cyan-300 hover:text-cyan-200 transition">
                  kontakt@dukartsystems.de
                </a><br />
                Telefon: +49 162 7263133
              </p>
              <p className="mt-3">
                mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder
                eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
                Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch
                nicht vorgeschrieben ist.
              </p>
              <p className="mt-3">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die
                Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Folgen des Widerrufs</h2>
              <p className="mt-3">
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von
                Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
                zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrages bei uns
                eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das
                Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
                wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen
                dieser Rückzahlung Entgelte berechnet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                Besondere Hinweise bei Dienstleistungsverträgen
              </h2>
              <p className="mt-3">
                Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen
                sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der
                bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts
                hinsichtlich dieses Vertrages unterrichten, bereits erbrachten Dienstleistungen
                im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen
                entspricht.
              </p>
              <p className="mt-3">
                Ihr Widerrufsrecht erlischt vorzeitig, wenn wir die Dienstleistung vollständig
                erbracht haben und mit der Ausführung erst begonnen haben, nachdem Sie dazu Ihre
                ausdrückliche Zustimmung gegeben und gleichzeitig Ihre Kenntnis davon bestätigt
                haben, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung durch uns
                verlieren.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Muster-Widerrufsformular</h2>
              <p className="mt-3 text-slate-400 text-sm">
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular
                aus und senden Sie es zurück.)
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6 text-sm leading-9">
                <p>
                  An: Dukart Systems, David Dukart, Im Sonneneck 12, 68642 Bürstadt,
                  E-Mail: kontakt@dukartsystems.de
                </p>
                <p className="mt-3">
                  Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
                  über die Erbringung der folgenden Dienstleistung (*):
                </p>
                <p className="mt-3">Bestellt am (*): ___________________________</p>
                <p>Name des/der Verbraucher(s): ___________________________</p>
                <p>Anschrift des/der Verbraucher(s): ___________________________</p>
                <p className="mt-3">
                  Unterschrift des/der Verbraucher(s): ___________________________<br />
                  (nur bei Mitteilung auf Papier)
                </p>
                <p className="mt-3">Datum: ___________________________</p>
                <p className="mt-4 text-slate-500">(*) Unzutreffendes streichen.</p>
              </div>
            </section>

          </div>
        </div>

        {/* Widerrufsbutton-Pflicht gem. § 312k BGB */}
        <div id="formular" className="mt-8 rounded-[2rem] border border-red-500/30 bg-red-500/5 p-8 shadow-2xl backdrop-blur scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              style={{
                background: "#ef4444",
                borderRadius: "10px",
                padding: "8px 20px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              Vertrag widerrufen
            </div>
            <p className="text-slate-400 text-sm">Online-Widerrufsformular gemäß § 312k BGB</p>
          </div>
          <WiderrufForm />
        </div>
      </div>
    </main>
  );
}
