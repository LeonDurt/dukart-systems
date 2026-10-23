"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Review = {
  id: string;
  name: string;
  email?: string;
  rating: number;
  text: string;
  isApproved: boolean;
  createdAt: string;
};

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "ADMIN" && role !== "SUPERVISOR") { router.push("/admin/orders"); return; }
      loadReviews();
    }
  }, [status]);

  async function loadReviews() {
    setLoading(true);
    const res = await fetch("/api/reviews?admin=1");
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  }

  async function handleApprove(id: string, approve: boolean) {
    setActionId(id);
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: approve }),
    });
    setActionId(null);
    loadReviews();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Bewertung von ${name} wirklich löschen?`)) return;
    setActionId(id);
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    setActionId(null);
    loadReviews();
  }

  const pending = reviews.filter(r => !r.isApproved);
  const approved = reviews.filter(r => r.isApproved);

  if (status === "loading" || loading) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Wird geladen...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Bewertungen</h1>
            <p className="mt-2 text-slate-400">Freischalten oder löschen – nur freigegebene erscheinen auf der Webseite.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
              ← Panel
            </Link>
          </div>
        </div>

        {/* Statistik */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Ausstehend</p>
            <p className="mt-2 text-3xl font-bold text-yellow-300">{pending.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Freigegeben</p>
            <p className="mt-2 text-3xl font-bold text-green-300">{approved.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Gesamt</p>
            <p className="mt-2 text-3xl font-bold">{reviews.length}</p>
          </div>
        </div>

        {/* Ausstehende */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-yellow-300">Warten auf Freigabe ({pending.length})</h2>
            <div className="space-y-4">
              {pending.map(review => (
                <ReviewCard key={review.id} review={review} actionId={actionId}
                  onApprove={() => handleApprove(review.id, true)}
                  onDelete={() => handleDelete(review.id, review.name)} />
              ))}
            </div>
          </div>
        )}

        {/* Freigegebene */}
        {approved.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-green-300">Freigegeben ({approved.length})</h2>
            <div className="space-y-4">
              {approved.map(review => (
                <ReviewCard key={review.id} review={review} actionId={actionId}
                  onRevoke={() => handleApprove(review.id, false)}
                  onDelete={() => handleDelete(review.id, review.name)} />
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
            Noch keine Bewertungen eingegangen.
          </div>
        )}
      </div>
    </main>
  );
}

function ReviewCard({
  review,
  actionId,
  onApprove,
  onRevoke,
  onDelete,
}: {
  review: Review;
  actionId: string | null;
  onApprove?: () => void;
  onRevoke?: () => void;
  onDelete: () => void;
}) {
  const busy = actionId === review.id;

  return (
    <div className={`rounded-2xl border p-5 transition ${
      review.isApproved ? "border-green-400/20 bg-green-400/5" : "border-white/10 bg-white/5"
    }`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold text-white">{review.name}</p>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= review.rating ? "text-cyan-300" : "text-white/20"}>★</span>
              ))}
            </div>
            <span className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString("de-DE")}</span>
            {review.email && <span className="text-xs text-slate-500">{review.email}</span>}
          </div>
          <p className="mt-2 text-sm text-slate-300">{review.text}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!review.isApproved && onApprove && (
            <button onClick={onApprove} disabled={busy}
              className="rounded-xl bg-green-400 px-3 py-1.5 text-xs font-medium text-slate-950 transition hover:scale-105 disabled:opacity-50">
              Freigeben
            </button>
          )}
          {review.isApproved && onRevoke && (
            <button onClick={onRevoke} disabled={busy}
              className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs text-yellow-300 transition hover:bg-yellow-400/20 disabled:opacity-50">
              Zurückziehen
            </button>
          )}
          <button onClick={onDelete} disabled={busy}
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/20 disabled:opacity-50">
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
