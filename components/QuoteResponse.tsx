"use client";

import { useState } from "react";

type Props = {
  invoiceId: string;
  number: string;
  total: number;
};

export default function QuoteResponse({ invoiceId, number, total }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "accepted" | "rejected" | "error">("idle");

  async function respond(decision: "ACCEPTED" | "REJECTED") {
    if (!confirm(decision === "ACCEPTED"
      ? `Angebot ${number} (${total.toFixed(2)} €) wirklich annehmen?`
      : `Angebot ${number} wirklich ablehnen?`)) return;

    setStatus("loading");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setStatus(decision === "ACCEPTED" ? "accepted" : "rejected");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "accepted") {
    return (
      <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-300">
        ✓ Angenommen
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-400">
        ✗ Abgelehnt
      </span>
    );
  }

  if (status === "error") {
    return <span className="text-xs text-red-400">Fehler – bitte Seite neu laden</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => respond("ACCEPTED")}
        disabled={status === "loading"}
        className="rounded-xl border border-green-400/30 bg-green-400/10 px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-400/20 disabled:opacity-50"
      >
        {status === "loading" ? "…" : "✓ Annehmen"}
      </button>
      <button
        onClick={() => respond("REJECTED")}
        disabled={status === "loading"}
        className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
      >
        {status === "loading" ? "…" : "✗ Ablehnen"}
      </button>
    </div>
  );
}
