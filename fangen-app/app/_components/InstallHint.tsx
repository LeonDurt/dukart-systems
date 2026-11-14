"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "./ui";

// Chrome auf Android meldet sich mit diesem Ereignis, wenn die Seite installierbar ist.
type InstallEvent = Event & { prompt: () => Promise<void> };

/** Erklärt, wie FANGEN als App auf den Startbildschirm kommt. In der installierten App unsichtbar. */
export default function InstallHint() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <section className="install-hint px-5 pt-12">
      <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime-400 text-zinc-950">
            <Smartphone className="size-5" />
          </span>
          <h2 className="text-lg font-extrabold">Als App aufs Handy</h2>
        </div>
        {installEvent ? (
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => {
              installEvent.prompt().catch(() => {});
              setInstallEvent(null);
            }}
          >
            App installieren
          </Button>
        ) : (
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-400">
            <li>
              <strong className="text-zinc-200">iPhone:</strong> In Safari auf Teilen tippen, dann „Zum
              Home-Bildschirm“.
            </li>
            <li>
              <strong className="text-zinc-200">Android:</strong> Im Menü von Chrome „App installieren“ oder „Zum
              Startbildschirm hinzufügen“.
            </li>
          </ul>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Danach startet FANGEN wie jede andere App: eigenes Symbol, Vollbild, ohne Adresszeile.
        </p>
      </div>
    </section>
  );
}
