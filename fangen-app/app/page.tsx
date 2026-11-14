import InstallHint from "./_components/InstallHint";
import { RULES } from "./_components/rules";
import StartForms from "./_components/StartForms";

const STEPS = [
  { title: "Runde aufmachen", text: "Einer macht das Spiel auf, zeichnet die Zone in die Karte und stellt drei Kisten mit Leibchen ab." },
  { title: "Leute einladen", text: "Link in die Gruppe. Wer ihn öffnet, sieht zuerst die Regeln und ist danach in der Lobby." },
  { title: "Laufen", text: "Ein Fänger, alle anderen rennen. Wer erwischt wird, holt sich ein Leibchen und fängt mit." },
];

export default function FangenHome() {
  return (
    <main className="mx-auto max-w-lg">
      <div className="vest-stripes h-2" aria-hidden />

      <section className="safe-top px-5 pb-8 pt-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">Das Stadtspiel</p>
        <h1 className="display mt-4 text-[5.5rem] text-white">
          Fan
          <br />
          gen<span className="text-orange-500">.</span>
        </h1>
        <p className="mt-6 text-xl font-bold leading-snug text-zinc-100">
          Vier Stunden. Eine Zone. Ein Fänger.
          <br />
          <span className="text-zinc-400">Und am Ende jagen alle den Letzten.</span>
        </p>
      </section>

      <section className="px-5">
        <StartForms />
      </section>

      <section className="px-5 pt-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">So läuft ein Spieltag</h2>
        <ol className="mt-4 space-y-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="display w-10 shrink-0 text-5xl text-lime-400">{index + 1}</span>
              <div>
                <h3 className="text-lg font-extrabold">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-zinc-400">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <InstallHint />

      <section className="px-5 pb-16 pt-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">Die Regeln</h2>
        <ul className="mt-4 divide-y divide-white/10 rounded-3xl border border-white/10 bg-zinc-900">
          {RULES.map((rule) => (
            <li key={rule.title} className="flex gap-4 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-500 text-zinc-950">
                <rule.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-extrabold">{rule.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{rule.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-zinc-500">
          Dein Standort wird nur während eines laufenden Spiels übertragen und nach Spielende gelöscht. Andere
          Läufer sehen ihn nie, Fänger nur beim Signal.
        </p>
      </section>
    </main>
  );
}
