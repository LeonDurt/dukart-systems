"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArchiveDeleteButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Auftrag ${orderNumber} endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/archive`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
    >
      {loading ? "…" : "Löschen"}
    </button>
  );
}
