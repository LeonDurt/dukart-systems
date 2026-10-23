"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  isCompleted: boolean;
  isArchived: boolean;
  canArchive: boolean;
}

export default function OrderActions({ orderId, isCompleted, isArchived, canArchive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"close" | "archive" | null>(null);

  async function closeOrder() {
    if (!confirm("Auftrag wirklich als abgeschlossen markieren?")) return;
    setLoading("close");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/close`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function archiveOrder() {
    if (!confirm("Auftrag archivieren? Er wird aus der aktiven Liste entfernt.")) return;
    setLoading("archive");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/archive`, { method: "POST" });
      if (res.ok) router.push("/admin/orders");
    } finally {
      setLoading(null);
    }
  }

  if (isArchived) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {!isCompleted && (
        <button
          onClick={closeOrder}
          disabled={loading !== null}
          className="rounded-2xl border border-green-400/30 bg-green-400/10 px-4 py-2 text-sm font-medium text-green-300 transition hover:bg-green-400/20 disabled:opacity-50"
        >
          {loading === "close" ? "..." : "✓ Auftrag schließen"}
        </button>
      )}
      {canArchive && isCompleted && (
        <button
          onClick={archiveOrder}
          disabled={loading !== null}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          {loading === "archive" ? "..." : "Archivieren"}
        </button>
      )}
    </div>
  );
}
