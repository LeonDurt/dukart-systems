import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addEvent, cleanText, fail, newToken, normalizeCode } from "@/lib/fangen/server";
import { LIMITS } from "@/lib/fangen/types";

// POST: einem Spiel beitreten. Geht in der Lobby und als Nachzügler im laufenden Spiel.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const name = cleanText(body?.name, LIMITS.nameLength);
  if (!name) return fail(400, "Wie heißt du?");

  const game = await prisma.tagGame.findUnique({
    where: { code: normalizeCode(code) },
    include: { players: { select: { name: true } } },
  });
  if (!game) return fail(404, "Dieses Spiel gibt es nicht (mehr).");
  if (game.status === "FINISHED") return fail(409, "Dieses Spiel ist schon vorbei.");
  if (game.players.length >= LIMITS.maxPlayers) return fail(409, "Das Spiel ist voll.");
  const taken = game.players.some((p) => p.name.toLowerCase() === name.toLowerCase());
  if (taken) return fail(409, "Den Namen gibt es schon. Nimm einen anderen.");

  const { token, tokenHash } = newToken();
  await prisma.tagPlayer.create({
    data: {
      gameId: game.id,
      name,
      tokenHash,
      // Beitreten kann man erst, nachdem die Regeln durchgelaufen sind.
      introSeenAt: body?.introSeen === true ? new Date() : null,
    },
  });
  if (game.status === "RUNNING") {
    await addEvent(game.id, "joined", `${name} ist nachträglich eingestiegen.`);
  }

  return NextResponse.json({ code: game.code, token });
}
