"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialEstimatedDate: string | null;
  initialFulfillmentType: string | null;
}

export default function OrderEditForm({
  orderId,
  initialTitle,
  initialDescription,
  initialEstimatedDate,
  initialFulfillmentType,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [estimatedDate, setEstimatedDate] = useState(
    initialEstimatedDate ? initialEstimatedDate.split("T")[0] : ""
  );
  const [fulfillmentType, setFulfillmentType] = useState(initialFulfillmentType ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Titel ist erforderlich."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          estimatedCompletionDate: estimatedDate || null,
          fulfillmentType: fulfillmentType || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Speichern.");
      } else {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Auftragsdetails</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          {open ? "Abbrechen" : "Bearbeiten"}
        </button>
      </div>

      {!open ? (
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Titel</span>
            <span className="text-right text-white font-medium">{initialTitle}</span>
          </div>
          {initialDescription && (
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-slate-500">Beschreibung</span>
              <span className="text-slate-300 text-xs leading-relaxed">{initialDescription}</span>
            </div>
          )}
          {initialEstimatedDate && (
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Geplant bis</span>
              <span>{new Date(initialEstimatedDate).toLocaleDateString("de-DE")}</span>
            </div>
          )}
          {initialFulfillmentType && (
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Abholung</span>
              <span>{initialFulfillmentType === "PICKUP" ? "Abholung" : "Versand"}</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Geplanter Abschluss</label>
            <input
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Fulfillment</label>
            <select
              value={fulfillmentType}
              onChange={(e) => setFulfillmentType(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            >
              <option value="">— nicht gesetzt —</option>
              <option value="PICKUP">Abholung</option>
              <option value="SHIPPING">Versand</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
        </form>
      )}
    </div>
  );
}
