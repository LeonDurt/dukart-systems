import { NextRequest, NextResponse } from "next/server";
import { isOutsideZone } from "@/lib/geo";
import { addEvent, authPlayer, buildState, fail, parseLatLng } from "@/lib/server";
import { save } from "@/lib/store";

// POST: der Herzschlag des Spiels. Jedes Handy meldet alle paar Sekunden seinen
// Standort und bekommt den Spielstand zurück, gefiltert nach dem, was es sehen darf.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht (mehr) in diesem Spiel.");
  const { game, player } = auth;

  const body = await req.json().catch(() => null);
  const position = parseLatLng(body?.lat, body?.lng);

  if (position && game.status !== "FINISHED") {
    const accuracy =
      typeof body.accuracy === "number" && Number.isFinite(body.accuracy)
        ? Math.max(0, Math.min(body.accuracy, 5000))
        : null;
    const outsideZone = game.status === "RUNNING" && isOutsideZone(position, game.zone, accuracy ?? 0);
    if (outsideZone && !player.outsideZone) {
      addEvent(game, "zone", `${player.name} hat die Zone verlassen!`);
    }
    player.lat = position[0];
    player.lng = position[1];
    player.accuracy = accuracy;
    player.locationAt = Date.now();
    player.outsideZone = outsideZone;
    save();
  }

  const after = typeof body?.afterMessageId === "number" ? Math.max(0, body.afterMessageId) : 0;
  return NextResponse.json(buildState(game, player, after));
}
