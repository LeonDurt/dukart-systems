"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Image from "next/image";
import { Cpu, Wrench, ShieldCheck, Sparkles, Star, Users, ArrowRight, BadgeEuro, Globe, Network, Menu, X, Check, Zap, MonitorCheck } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

import { motion, type Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.08,
      ease: "easeOut" as const,
    },
  }),
};

const hoverCard = {
  whileHover: { scale: 1.02, y: -6 },
  transition: {
    type: "tween" as const,
    duration: 0.16,
    ease: "easeOut" as const,
  },
};

const hoverCardSoft = {
  whileHover: { scale: 1.015, y: -4 },
  transition: {
    type: "tween" as const,
    duration: 0.16,
    ease: "easeOut" as const,
  },
};

export default function DukartSystemsWebsite() {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/", referer: document.referrer || null }),
    }).catch(() => {});
  }, []);

  // URL-Parameter vom Konfigurator auslesen und Formular vorausfüllen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSubject = params.get("subject");
    const urlMessage = params.get("message");
    if (urlSubject) setSubject(urlSubject);
    if (urlMessage) setMessage(urlMessage);
    if (urlSubject || urlMessage) {
      // Kurz warten bis die Seite gerendert ist, dann zum Kontaktformular scrollen
      setTimeout(() => {
        document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("PC-Service & Reparatur");
  const [message, setMessage] = useState("");
  const contactRef = useRef<HTMLElement>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewsData, setReviewsData] = useState<any[]>([]);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  
  e.preventDefault();
  if (website) {
  return;
  }
  setLoading(true);
  setSuccess(false);
  setError("");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), contact, phone: phone || undefined, subject, message }),
    });

    if (!response.ok) {
      throw new Error("Fehler beim Senden");
    }

    setSuccess(true);
    setFirstName("");
    setLastName("");
    setContact("");
    setPhone("");
    setSubject("PC-Service & Reparatur");
    setMessage("");
  } catch (err) {
    setError("Die Anfrage konnte nicht gesendet werden. Bitte versuche es später erneut.");
  } finally {
    setLoading(false);
  }
}

async function handleReviewSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setReviewLoading(true);
  setReviewSuccess(false);
  setReviewError("");

  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: reviewName, rating: reviewRating, text: reviewText }),
    });

    if (!response.ok) throw new Error("Fehler");

    setReviewSuccess(true);
    setReviewName("");
    setReviewRating("5");
    setReviewText("");
  } catch {
    setReviewError("Die Bewertung konnte nicht gesendet werden.");
  } finally {
    setReviewLoading(false);
  }
}

useEffect(() => {
  fetch("/api/reviews")
    .then(res => res.json())
    .then(data => setReviewsData(Array.isArray(data) ? data : []))
    .catch(() => setReviewsData([]));
}, []);

  const services = [
    {
      icon: Cpu,
      title: "PC-Service & Reparatur",
      text: "Fehlerdiagnose, langsame PCs beschleunigen, Hardware-Probleme lösen und saubere Hilfe ohne komplizierte Erklärungen.",
      price: "ab 49€",
      details: "Ideal bei Abstürzen, langsamen Systemen, kaputten Komponenten oder allgemeiner PC-Hilfe.",
    },
    {
      icon: Sparkles,
      title: "Individuelle PC-Builds",
      text: "Gaming-, Office- und Allround-PCs passend zum Budget – mit ehrlicher Beratung, Teileauswahl und sauberem Zusammenbau.",
      price: "ab 399€",
      details: "Beratung, Zusammenbau, Einrichtung und optional Windows-Setup in einem Paket.",
    },
    {
      icon: Wrench,
      title: "Upgrade & Optimierung",
      text: "SSD, RAM, Kühlung oder Grafikkarte – wir holen mehr aus deinem aktuellen System heraus.",
      price: "ab 69€",
      details: "Perfekt, wenn dein PC nicht komplett neu sein muss, aber deutlich besser laufen soll.",
    },
    {
      icon: ShieldCheck,
      title: "Wartung & Support",
      text: "Regelmäßige Checks, Updates, Reinigung, Hilfe bei Problemen und langfristige Unterstützung im Alltag.",
      price: "auf Anfrage",
      details: "Auch als wiederkehrender Support für Privatkunden oder kleine Unternehmen geeignet.",
    },
    {
      icon: Network,
      title: "IT-Dienstleistungen",
      text: "Software-Installation, WLAN-Einrichtung, Smart-Home-Konfiguration und allgemeine IT-Hilfe – schnell, unkompliziert und ohne großen Aufwand.",
      price: "ab 59€",
      details: "Ideal für alles, was per Fernzugriff oder mit wenig Aufwand gelöst werden kann – kein Vor-Ort-Einsatz nötig.",
    },
    {
      icon: Globe,
      title: "Kleine Webseiten",
      text: "Moderne, schnelle Webseiten für Kleinunternehmer, Freelancer oder Vereine – schlank, professionell und ohne Abo-Falle.",
      price: "ab 299€",
      details: "Inkl. Beratung, Design, Umsetzung und kurzer Einweisung. Hosting optional dazu buchbar.",
    },
  ];

  const highlights = [
    "Persönlicher Ansprechpartner",
    "Moderne, ehrliche Beratung",
    "Faire Preise ohne versteckte Kosten",
    "Für Privatkunden und kleine Unternehmen",
  ];

const reviews = reviewsData;

  const team = [
    {
      name: "Leon Dukart",
      role: "Geschäftsführer",
      text: "Fokus auf PC-Service, individuelle Builds, saubere Problemlösung und moderne IT-Unterstützung mit echter Praxiserfahrung.",
    },
    {
      name: "David Dukart",
      role: "Geschäftsführer",
      text: "Unterstützt bei Aufbau, Kundenkontakt, Umsetzung und dem gemeinsamen Ausbau von Dukart Systems.",
    },
  ];

  const faqs = [
    {
      question: "Für wen ist Dukart Systems gedacht?",
      answer: "Für Privatkunden und kleine Unternehmen, die schnelle, ehrliche Hilfe bei PCs, IT und Webseiten suchen – ohne Callcenter und ohne versteckte Kosten.",
    },
    {
      question: "Bietet ihr auch individuelle Gaming-PCs an?",
      answer: "Ja. Wir helfen bei der Teileauswahl, achten auf dein Budget und bauen den PC komplett auf – inkl. Windows und Treiber wenn gewünscht.",
    },
    {
      question: "Was genau sind IT-Dienstleistungen?",
      answer: "Software-Installation, WLAN-Einrichtung, Smart-Home-Konfiguration (Apps, Automatisierungen, Einrichtung) und allgemeine IT-Hilfe. Vieles davon lässt sich per Fernzugriff lösen – schnell und ohne Vor-Ort-Termin.",
    },
    {
      question: "Was kostet eine kleine Webseite?",
      answer: "Ab 299€ – je nach Umfang. Darin enthalten sind Beratung, Design, Umsetzung und eine kurze Einweisung. Hosting ist optional dazu buchbar.",
    },
    {
      question: "Kann ich mich auch nur für eine Beratung melden?",
      answer: "Ja, natürlich. Auch wenn du noch unsicher bist oder erst wissen willst, was für dich Sinn macht, kannst du einfach anfragen. Keine Kosten.",
    },
    {
      question: "Gibt es auch langfristigen Support?",
      answer: "Ja. Neben einzelnen Aufträgen sind auch Wartung, Unterstützung bei Problemen und laufender IT-Support möglich – auch regelmäßig.",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />

      <section className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Dukart Systems Logo" width={100} height={100} className="rounded-full" />
            <div>
              <div className="text-lg font-semibold tracking-wide sm:text-xl">Dukart Systems</div>
              <div className="hidden text-sm text-slate-400 sm:block">PC-Service • IT • Webseiten • Support</div>
            </div>
          </div>
          <div className="hidden gap-6 text-sm text-slate-300 md:flex">
            <a href="#leistungen" className="transition hover:text-cyan-300">Leistungen</a>
            <a href="#team" className="transition hover:text-cyan-300">Team</a>
            <a href="#bewertungen" className="transition hover:text-cyan-300">Bewertungen</a>
            <a href="#kontakt" className="transition hover:text-cyan-300">Kontakt</a>
            <a href="/konfigurator" className="transition hover:text-cyan-300">PC-Konfigurator</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/login"
              className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white sm:block"
              title="Nur für bestehende Kunden mit Einladung"
            >
              Kundenportal
            </a>
            <a
              href="#kontakt"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-lg transition hover:scale-105 sm:px-5"
            >
              Anfrage
            </a>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white md:hidden"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {[
                { href: "#leistungen", label: "Leistungen" },
                { href: "#team", label: "Team" },
                { href: "#bewertungen", label: "Bewertungen" },
                { href: "#kontakt", label: "Kontakt" },
                { href: "/konfigurator", label: "PC-Konfigurator" },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 border-t border-white/10 pt-3">
                <a
                  href="/login"
                  className="flex items-center rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-300"
                >
                  Kundenportal →
                </a>
              </div>
            </nav>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <div className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300 shadow-lg shadow-cyan-500/10">
              Lokal. Persönlich. Modern.
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
              PC-Service, IT & Webseiten –{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                professionell, direkt
              </span>{" "}
              und ohne Umwege.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Individuelle PC-Builds, Reparaturen, IT-Dienstleistungen und Webseiten für Privatkunden und kleine Unternehmen – persönlich betreut, fair bepreist.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400" />
                Persönlicher Support
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                Schnelle Umsetzung
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <MonitorCheck className="h-3.5 w-3.5 text-cyan-400" />
                Vor Ort & Remote
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#kontakt"
                className="group rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 shadow-xl transition hover:scale-105"
              >
                Kostenlose Anfrage starten
                <ArrowRight className="ml-2 inline h-4 w-4 transition group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="relative"
          >
            <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -right-6 bottom-8 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-md">
              <div className="grid gap-4 sm:grid-cols-2">
                {highlights.map((item, index) => (
                  <motion.div
                    key={item}
                    custom={index + 1}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    whileHover={hoverCardSoft.whileHover}
                    transition={hoverCardSoft.transition}
                    className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 will-change-transform transition-colors duration-150"
                  >
                    <div className="text-base font-semibold">{item}</div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                whileHover={hoverCardSoft.whileHover}
                transition={hoverCardSoft.transition}
                className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-100 shadow-lg shadow-cyan-500/10 will-change-transform"
              >
                <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Beliebt</div>
                <div className="mt-2 text-2xl font-bold">PC-Check & Beratung</div>
                <div className="mt-2 text-slate-200">Für langsame PCs, Upgrade-Wünsche oder den Start in einen neuen Build.</div>
                <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">ab 59€</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="leistungen" className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">Leistungen</h2>
          <p className="mt-3 text-slate-300">
            Von PC-Reparaturen über IT-Betreuung bis zu kleinen Webseiten – alles aus einer Hand, fair und professionell.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                custom={index + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={fadeUp}
                whileHover={hoverCard.whileHover}
                transition={hoverCard.transition}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl will-change-transform transition-colors duration-150 hover:border-cyan-300/40 hover:bg-white/10 hover:shadow-cyan-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/0 via-cyan-400/0 to-cyan-400/10 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="mb-4 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{service.text}</p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-cyan-200">
                    <BadgeEuro className="h-4 w-4" />
                    {service.price}
                  </div>

                  <div className="mt-4 max-h-0 overflow-hidden text-sm text-slate-200 opacity-0 transition-all duration-200 group-hover:max-h-24 group-hover:opacity-100">
                    {service.details}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.h2
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="text-3xl font-bold sm:text-4xl mb-6"
        >
          Warum Dukart Systems?
        </motion.h2>
              
        <div className="grid gap-6 md:grid-cols-3">
              
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            whileHover={hoverCard.whileHover}
            transition={hoverCard.transition}
            className="rounded-2xl bg-white/5 p-6 border border-white/10 will-change-transform transition-colors duration-150 hover:border-cyan-300/30"
          >
            <h3 className="font-semibold text-lg">Ehrliche Beratung</h3>
            <p className="mt-2 text-slate-300">
              Wir verkaufen dir nichts Unnötiges – nur das, was wirklich Sinn macht.
            </p>
          </motion.div>
              
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            whileHover={hoverCard.whileHover}
            transition={hoverCard.transition}
            className="rounded-2xl bg-white/5 p-6 border border-white/10 will-change-transform transition-colors duration-150 hover:border-cyan-300/30"
          >
            <h3 className="font-semibold text-lg">Schnelle Umsetzung</h3>
            <p className="mt-2 text-slate-300">
              Kein wochenlanges Warten – wir kümmern uns schnell um dein Problem.
            </p>
          </motion.div>
              
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            whileHover={hoverCard.whileHover}
            transition={hoverCard.transition}
            className="rounded-2xl bg-white/5 p-6 border border-white/10 will-change-transform transition-colors duration-150 hover:border-cyan-300/30"
          >
            <h3 className="font-semibold text-lg">Persönlicher Kontakt</h3>
            <p className="mt-2 text-slate-300">
              Kein Callcenter – du sprichst direkt mit uns.
            </p>
          </motion.div>
              
        </div>
      </section>

      <section id="team" className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">Das Team hinter Dukart Systems</h2>
          <p className="mt-3 text-slate-300">Persönlich, nahbar und trotzdem professionell – das schafft direkt Vertrauen.</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              custom={index + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              whileHover={hoverCard.whileHover}
              transition={hoverCard.transition}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl will-change-transform transition-colors duration-150 hover:border-cyan-300/30"
            >
              <div className="mb-4 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-semibold">{member.name}</h3>
              <div className="mt-1 text-cyan-300">{member.role}</div>
              <p className="mt-4 text-slate-300">{member.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="kontakt" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">Kontakt</h2>
            <p className="mt-4 max-w-xl text-slate-300">
              Schreib uns für einen neuen PC, ein Upgrade, eine Reparatur, eine Webseite oder eine allgemeine Anfrage. Schnell, direkt und ohne Umwege.
            </p>

            <div className="mt-8 space-y-4 text-slate-200">
              <div>
                <div className="text-sm text-slate-400">E-Mail</div>
                <div className="font-medium">kontakt@dukartsystems.de</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Antwortzeit</div>
                <div className="font-medium">In der Regel sehr schnell</div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <p className="text-sm font-semibold text-cyan-300">Bereits Kunde bei uns?</p>
              <p className="mt-1.5 text-sm text-slate-400">
                Das Kundenportal ist nur für Kunden mit einer Einladung zugänglich. Stelle zuerst eine Anfrage über das Formular oder den Chat – wir schalten dich dann frei.
              </p>
              <a
                href="/login"
                className="mt-3 inline-block rounded-xl border border-cyan-400/25 px-4 py-1.5 text-xs text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
              >
                Zum Kundenportal →
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" as const }}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur"
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Vorname</label>
                  <input
                    type="text"
                    placeholder="Max"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Nachname</label>
                  <input
                    type="text"
                    placeholder="Mustermann"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">E-Mail</label>
                <input
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Telefonnummer <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="z.B. 0151 12345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Worum geht es?</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                >
                  <option>PC-Service & Reparatur</option>
                  <option>Individueller PC-Build</option>
                  <option>Upgrade & Optimierung</option>
                  <option>Wartung & Support</option>
                  <option>IT-Dienstleistung</option>
                  <option>Webseite</option>
                  <option>Allgemeine Anfrage</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Nachricht</label>
                <textarea
                  rows={5}
                  placeholder="Beschreibe kurz dein Anliegen"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                />
              </div>
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 shadow-xl transition hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? "Wird gesendet..." : "Anfrage absenden"}
              </button>
              
              {success && (
                <p className="text-sm text-green-400">
                  Anfrage erfolgreich gesendet.
                </p>
              )}
              
              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">Häufige Fragen</h2>
          <p className="mt-3 text-slate-300">Die häufigsten Fragen rund um unsere Leistungen.</p>
        </motion.div>

        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              custom={index + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{
                type: "tween",
                duration: 0.14,
                ease: "easeOut",
              }}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 will-change-transform transition-colors duration-150 hover:border-cyan-300/30"
            >
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-3 text-slate-300">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="bewertungen" className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">Bewertungen</h2>
          <p className="mt-3 text-slate-300">
            Echte freigegebene Bewertungen von Kunden.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <motion.div
                key={index}
                custom={index + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                whileHover={hoverCard.whileHover}
                transition={hoverCard.transition}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl will-change-transform transition-colors duration-150 hover:border-cyan-300/30"
              >
                <div className="mb-4 flex gap-1 text-cyan-300">
                  {[...Array(Number(review.rating) || 5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-200">“{review.text}”</p>
                <div className="mt-5 text-sm font-semibold text-slate-400">
                  {review.name}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-slate-300">
              Noch keine freigegebenen Bewertungen vorhanden.
            </div>
          )}
        </div>
      </section>

      <section id="bewertung-abgeben" className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
          <h2 className="text-3xl font-bold sm:text-4xl">Bewertung abgeben</h2>
          <p className="mt-3 text-slate-300">
            Du warst zufrieden? Dann freuen wir uns über deine Bewertung.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleReviewSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Name</label>
              <input
                type="text"
                placeholder="Dein Name"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Sterne</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="5">5 Sterne</option>
                <option value="4">4 Sterne</option>
                <option value="3">3 Sterne</option>
                <option value="2">2 Sterne</option>
                <option value="1">1 Stern</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Bewertung</label>
              <textarea
                rows={5}
                placeholder="Wie war deine Erfahrung mit Dukart Systems?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </div>

            <button
              type="submit"
              disabled={reviewLoading}
              className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 shadow-xl transition hover:scale-[1.02] disabled:opacity-60"
            >
              {reviewLoading ? "Wird gesendet..." : "Bewertung absenden"}
            </button>

            {reviewSuccess && (
              <p className="text-sm text-green-400">
                Bewertung erfolgreich gesendet.
              </p>
            )}

            {reviewError && (
              <p className="text-sm text-red-400">
                {reviewError}
              </p>
            )}
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-400">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <div>© 2026 Dukart Systems. Alle Rechte vorbehalten.</div>
              <a
                href="/widerruf#formular"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#fca5a5",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  width: "fit-content",
                }}
              >
                Vertrag widerrufen
              </a>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="https://www.instagram.com/dukartsystems/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition hover:text-pink-400"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
              <a href="/impressum" className="transition hover:text-cyan-300">Impressum</a>
              <a href="/datenschutz" className="transition hover:text-cyan-300">Datenschutz</a>
              <a href="/agb" className="transition hover:text-cyan-300">AGB</a>
              <a href="/widerruf" className="transition hover:text-cyan-300">Widerruf</a>
              <a href="#kontakt" className="transition hover:text-cyan-300">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
