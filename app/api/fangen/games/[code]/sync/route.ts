import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOutsideZone } from "@/lib/fangen/geo";
import { addEvent, authPlayer, buildState, fail, parseLatLng, zoneOf } from "@/lib/fangen/server";

// POST: der Herzschlag des Spiels. Jedes Handy meldet alle paar Sekunden seinen
// Standort und bekommt den Spielstand zurück, gefiltert nach dem, was es sehen darf.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = await authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht (mehr) in diesem Spiel.");
  const { game, player } = auth;

  const body = await req.json().catch(() => null);
  const position = parseLatLng(body?.lat, body?.lng);

  if (position && game.status !== "FINISHED") {
    const accuracy =
      typeof body.accuracy === "number" && Number.isFinite(body.accuracy)
        ? Math.max(0, Math.min(body.accuracy, 5000))
        : null;
    const outsideZone =
      game.status === "RUNNING" && isOutsideZone(position, zoneOf(game), accuracy ?? 0);
    await prisma.tagPlayer.update({
      where: { id: player.id },
      data: { lat: position[0], lng: position[1], accuracy, locationAt: new Date(), outsideZone },
    });
    if (outsideZone && !player.outsideZone) {
      await addEvent(game.id, "zone", `${player.name} hat die Zone verlassen!`);
    }
  }

  const after = typeof body?.afterMessageId === "number" ? Math.max(0, body.afterMessageId) : 0;
  const state = await buildState(game.id, player.id, after);
  if (!state) return fail(404, "Dieses Spiel gibt es nicht mehr.");
  return NextResponse.json(state);
}
