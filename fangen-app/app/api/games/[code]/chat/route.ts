import { NextRequest, NextResponse } from "next/server";
import { addMessage, authPlayer, cleanText, fail } from "@/lib/server";
import { LIMITS } from "@/lib/types";

// POST: Nachricht in den Chat. Der Fänger Chat ist nur für Fänger.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht in diesem Spiel.");
  const { game, player } = auth;

  const body = await req.json().catch(() => null);
  const text = cleanText(body?.text, LIMITS.messageLength);
  if (!text) return fail(400, "Die Nachricht ist leer.");
  const channel = body?.channel === "CATCHERS" ? "CATCHERS" : "ALL";
  if (channel === "CATCHERS" && player.role !== "CATCHER") {
    return fail(403, "Der Fänger Chat ist nur für Fänger.");
  }

  addMessage(game, player, channel, text);
  return NextResponse.json({ ok: true });
}
