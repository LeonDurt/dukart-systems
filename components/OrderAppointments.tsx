"use client";

import { useState, useEffect } from "react";

interface Appointment {
  id: string;
  title: string;
  date: string;
  notes: string | null;
}

const QUICK_TITLES = [
  "Telefon mit Kunde",
  "Vor-Ort Termin",
  "Abholung",
  "Lieferung",
  "Beratungsgespräch",
  "Rückruf",
];

export default function OrderAppointments({ orderId }: { orderId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/orders/${orderId}/appointments`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, notes }),
    });
    if (res.ok) {
      setTitle("");
      setDate("");
      setNotes("");
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(appointmentId: string) {
    if (!confirm("Termin löschen?")) return;
    await fetch(`/api/admin/orders/${orderId}/appointments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId }),
    });
    await load();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          📅 Termine
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500 transition"
        >
          {showForm ? "Abbrechen" : "+ Termin erstellen"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Schnellauswahl</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition border ${
                    title === t
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Bezeichnung</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Telefon mit Kunde"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Datum & Uhrzeit</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notizen (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Kunde anrufen wegen GPU-Auswahl"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-cyan-600 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 transition"
          >
            {saving ? "Wird erstellt…" : "Termin erstellen & in Kalender eintragen"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-slate-500">Lade Termine…</p>}
        {!loading && appointments.length === 0 && (
          <p className="text-sm text-slate-500">Noch keine Termine für diesen Auftrag.</p>
        )}
        {appointments.map((appt) => {
          const d = new Date(appt.date);
          const isPast = d < new Date();
          return (
            <div
              key={appt.id}
              className={`flex items-start justify-between rounded-xl border px-4 py-3 ${
                isPast ? "border-white/5 bg-white/3 opacity-60" : "border-white/10 bg-white/5"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white">{appt.title}</p>
                <p className="text-xs text-cyan-300 mt-0.5">
                  {d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                  {d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                </p>
                {appt.notes && <p className="text-xs text-slate-400 mt-1">{appt.notes}</p>}
              </div>
              <button
                onClick={() => remove(appt.id)}
                className="ml-4 text-slate-500 hover:text-red-400 transition text-lg leading-none"
                title="Termin löschen"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
