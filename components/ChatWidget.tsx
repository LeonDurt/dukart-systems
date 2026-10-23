"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, RotateCcw, Check } from "lucide-react";

type StepType = "welcome" | "details" | "followup" | "urgency" | "name" | "contact" | "confirm" | "success";

interface StepState {
  type: StepType;
  service?: string;
  details?: string;
  followup?: string;
  urgency?: string;
  name?: string;
  contact?: string;
}

interface Message {
  from: "bot" | "user";
  text: string;
}

const SERVICES = [
  { label: "PC-Reparatur", icon: "🔧" },
  { label: "PC-Build", icon: "🖥️" },
  { label: "Upgrade & Optimierung", icon: "⚡" },
  { label: "IT-Support", icon: "🌐" },
  { label: "Webseite", icon: "💻" },
  { label: "Sonstiges", icon: "💬" },
];

const SERVICE_Q1: Record<string, string> = {
  "PC-Reparatur": "Was genau ist das Problem? (z.B. startet nicht, sehr langsam, blaues Bild, Geräusche…)",
  "PC-Build": "Wofür soll der PC genutzt werden und hast du ein ungefähres Budget? (z.B. Gaming bis 1.000€)",
  "Upgrade & Optimierung": "Was soll aufgerüstet oder optimiert werden? (z.B. SSD, mehr RAM, Grafikkarte…)",
  "IT-Support": "Beschreibe kurz das Problem oder das Projekt – was soll gelöst oder umgesetzt werden?",
  "Webseite": "Was für eine Webseite stellst du dir vor? (z.B. Portfolio, Firmenwebseite, Onlineshop)",
  "Sonstiges": "Beschreibe kurz dein Anliegen, ich leite es direkt weiter.",
};

const SERVICE_Q2: Record<string, string> = {
  "PC-Reparatur": "Wie alt ist der PC ungefähr und welches Betriebssystem nutzt du? (z.B. Windows 11)",
  "PC-Build": "Hast du bereits Teile oder Vorstellungen, oder sollen wir alles von Grund auf neu planen?",
  "Upgrade & Optimierung": "Weißt du schon welche Hardware du aktuell verbaut hast? (z.B. CPU, RAM-Größe, Grafikkarte)",
  "IT-Support": "Betrifft das eine Privatperson oder ein Unternehmen? Und wie viele Geräte sind betroffen?",
  "Webseite": "Hast du bereits eine Domain oder Hosting, oder startest du komplett neu?",
  "Sonstiges": "Gibt es noch weitere Details oder Wünsche die ich weitergeben soll?",
};

const URGENCY_OPTIONS = [
  { label: "🔴 Sehr dringend", value: "Sehr dringend" },
  { label: "🟡 Baldmöglich", value: "Baldmöglich" },
  { label: "🟢 Kein Stress", value: "Kein Stress" },
];

const WELCOME_MSG = "Hey! 👋 Ich helfe dir dabei, schnell die richtige Hilfe anzufragen. Womit kann ich helfen?";

const INITIAL_MESSAGES: Message[] = [{ from: "bot", text: WELCOME_MSG }];
const INITIAL_STEP: StepState = { type: "welcome" };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<StepState>(INITIAL_STEP);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, step.type]);

  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  function closeChat() {
    setOpen(false);
    // Verlauf nach kurzer Verzögerung löschen (nach der Schließ-Animation)
    setTimeout(() => {
      setMessages(INITIAL_MESSAGES);
      setStep(INITIAL_STEP);
      setInput("");
    }, 300);
  }

  function addBot(text: string) {
    setMessages(prev => [...prev, { from: "bot", text }]);
  }
  function addUser(text: string) {
    setMessages(prev => [...prev, { from: "user", text }]);
  }

  function selectService(service: string) {
    addUser(service);
    setTimeout(() => {
      addBot(SERVICE_Q1[service]);
      setStep({ type: "details", service });
    }, 250);
  }

  function selectUrgency(urgency: string) {
    addUser(urgency);
    setTimeout(() => {
      addBot("Alles klar! Wie heißt du?");
      setStep(prev => ({ ...prev, type: "name", urgency }));
    }, 250);
  }

  function submitInput() {
    const val = input.trim();
    if (!val) return;
    setInput("");

    if (step.type === "details") {
      addUser(val);
      setTimeout(() => {
        addBot(SERVICE_Q2[step.service!]);
        setStep(prev => ({ ...prev, type: "followup", details: val }));
      }, 250);

    } else if (step.type === "followup") {
      addUser(val);
      setTimeout(() => {
        addBot("Wie dringend ist dein Anliegen?");
        setStep(prev => ({ ...prev, type: "urgency", followup: val }));
      }, 250);

    } else if (step.type === "name") {
      addUser(val);
      setTimeout(() => {
        addBot(`Schön, ${val}! Gib bitte deine E-Mail-Adresse oder Telefonnummer ein, damit wir dich direkt kontaktieren können. (z.B. max@gmail.com oder 0151 12345678)`);
        setStep(prev => ({ ...prev, type: "contact", name: val }));
      }, 250);

    } else if (step.type === "contact") {
      addUser(val);
      setTimeout(() => {
        addBot(
          `Super, ich fasse kurz zusammen:\n\n` +
          `📋 Thema: ${step.service}\n` +
          `💬 Problem: ${step.details}\n` +
          `🔍 Details: ${step.followup}\n` +
          `⏱️ Dringlichkeit: ${step.urgency}\n` +
          `👤 Name: ${step.name}\n` +
          `📬 Kontakt: ${val}\n\n` +
          `Alles richtig so? Dann einfach auf „Absenden" klicken.`
        );
        setStep(prev => ({ ...prev, type: "confirm", contact: val }));
      }, 250);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submitInput();
  }

  async function confirm() {
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: step.name,
          contact: step.contact,
          subject: step.service,
          message:
            `[Chat-Anfrage via Webchat]\n` +
            `Service: ${step.service}\n` +
            `Dringlichkeit: ${step.urgency}\n\n` +
            `Problem/Anliegen:\n${step.details}\n\n` +
            `Weitere Details:\n${step.followup}`,
        }),
      });
      if (!res.ok) throw new Error();
      addBot("Perfekt, deine Anfrage ist bei uns! 🎉 Wir melden uns so schnell wie möglich bei dir.");
      setStep(prev => ({ ...prev, type: "success" }));
    } catch {
      addBot("Ups, das hat leider nicht geklappt. Versuche es nochmal oder schreib uns direkt an kontakt@dukartsystems.de");
    } finally {
      setSending(false);
    }
  }

  function restart() {
    setMessages(INITIAL_MESSAGES);
    setStep(INITIAL_STEP);
    setInput("");
  }

  const showInput = step.type === "details" || step.type === "followup" || step.type === "name" || step.type === "contact";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chatbox"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex w-[min(calc(100vw-2rem),340px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 sm:w-[380px]"
            style={{ maxHeight: "min(70vh, 540px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-800/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Dukart Systems</p>
                  <p className="text-xs text-slate-400 mt-0.5">Antwortet schnell</p>
                </div>
              </div>
              <button onClick={closeChat} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.from === "bot" && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-xs text-cyan-300 font-bold">
                      D
                    </div>
                  )}
                  <div className={`max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.from === "user"
                      ? "rounded-br-sm bg-cyan-500 text-white"
                      : "rounded-bl-sm bg-white/10 text-slate-200"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Service selection */}
              {step.type === "welcome" && (
                <div className="flex flex-wrap gap-2 pl-8 pt-1">
                  {SERVICES.map(s => (
                    <button
                      key={s.label}
                      onClick={() => selectService(s.label)}
                      className="rounded-xl border border-cyan-400/25 bg-cyan-400/8 px-3 py-1.5 text-xs text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/15"
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Urgency selection */}
              {step.type === "urgency" && (
                <div className="flex flex-wrap gap-2 pl-8 pt-1">
                  {URGENCY_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => selectUrgency(o.value)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Confirm / Restart */}
              {step.type === "confirm" && (
                <div className="flex gap-2 pl-8 pt-1">
                  <button
                    onClick={confirm}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-50"
                  >
                    <Check size={13} />
                    {sending ? "Wird gesendet…" : "Absenden"}
                  </button>
                  <button
                    onClick={restart}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-400 transition hover:text-white"
                  >
                    <RotateCcw size={12} />
                    Neu starten
                  </button>
                </div>
              )}

              {/* New request after success */}
              {step.type === "success" && (
                <div className="pl-8 pt-1">
                  <button
                    onClick={restart}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-400 transition hover:text-white"
                  >
                    <RotateCcw size={12} />
                    Neue Anfrage
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Text input */}
            {showInput && (
              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={
                      step.type === "name" ? "Dein Name…"
                      : step.type === "contact" ? "z.B. max@gmail.com oder 0151 12345678"
                      : "Schreibe hier…"
                    }
                    className="flex-1 rounded-xl bg-white/8 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1 focus:ring-cyan-400/50"
                  />
                  <button
                    onClick={submitInput}
                    disabled={!input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:opacity-30"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 transition hover:bg-cyan-400"
        aria-label="Chat öffnen"
      >
        {pulse && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-cyan-400 opacity-30 pointer-events-none" />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
