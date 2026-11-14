import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanText, fail, newGameCode, newToken, purgeOldGames } from "@/lib/fangen/server";
import { LIMITS } from "@/lib/fangen/types";

// POST: neues Spiel anlegen. Wer es anlegt, ist Host.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const gameName = cleanText(body?.gameName, LIMITS.gameNameLength);
  const hostName = cleanText(body?.hostName, LIMITS.nameLength);
  if (!gameName) return fail(400, "Gib dem Spiel einen Namen.");
  if (!hostName) return fail(400, "Wie heißt du?");

  purgeOldGames().catch(console.error);

  const code = await newGameCode();
  const { token, tokenHash } = newToken();
  await prisma.tagGame.create({
    data: {
      code,
      name: gameName,
      players: {
        create: { name: hostName, tokenHash, isHost: true, introSeenAt: new Date() },
      },
    },
  });

  return NextResponse.json({ code, token });
}
