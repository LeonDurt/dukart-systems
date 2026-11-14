import { NextRequest, NextResponse } from "next/server";
import { cleanText, createGame, fail, purgeOldGames } from "@/lib/server";
import { LIMITS } from "@/lib/types";

// POST: neues Spiel anlegen. Wer es anlegt, ist Host.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const gameName = cleanText(body?.gameName, LIMITS.gameNameLength);
  const hostName = cleanText(body?.hostName, LIMITS.nameLength);
  if (!gameName) return fail(400, "Gib dem Spiel einen Namen.");
  if (!hostName) return fail(400, "Wie heißt du?");

  purgeOldGames();
  const { game, token } = createGame(gameName, hostName);
  return NextResponse.json({ code: game.code, token });
}
