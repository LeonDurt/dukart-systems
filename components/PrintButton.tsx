"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 transition"
    >
      Drucken / Als PDF speichern
    </button>
  );
}
