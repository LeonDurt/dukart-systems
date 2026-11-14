import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { LatLng } from "@/lib/geo";
import { authPlayer, clampInt, cleanText, fail, parseLatLng, publicInfo } from "@/lib/server";
import { save } from "@/lib/store";
import { LIMITS } from "@/lib/types";

type Params = { params: Promise<{ code: string }> };

// GET: öffentliche Kurzinfo für den Einladungslink (ohne Standorte, ohne Namen der Mitspieler).
export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const info = publicInfo(code);
  if (!info) return fail(404, "Dieses Spiel gibt es nicht (mehr).");
  return NextResponse.json(info);
}

// PATCH: Host stellt in der Lobby Zone, Kisten und Zeiten ein.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const auth = authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht in diesem Spiel.");
  const { game, player } = auth;
  if (!player.isHost) return fail(403, "Nur der Host kann das Spiel einstellen.");
  if (game.status !== "LOBBY") return fail(409, "Einstellungen gehen nur vor dem Start.");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return fail(400, "Ungültige Anfrage.");

  // Erst alles prüfen, dann übernehmen: eine halb gültige Anfrage ändert nichts.
  let name: string | null = null;
  if (body.name !== undefined) {
    name = cleanText(body.name, LIMITS.gameNameLength);
    if (!name) return fail(400, "Der Spielname darf nicht leer sein.");
  }

  let zone: LatLng[] | null = null;
  if (body.zone !== undefined) {
    if (!Array.isArray(body.zone) || body.zone.length > LIMITS.maxZonePoints) {
      return fail(400, "Die Zone ist ungültig.");
    }
    zone = [];
    for (const point of body.zone) {
      const parsed = Array.isArray(point) ? parseLatLng(point[0], point[1]) : null;
      if (!parsed) return fail(400, "Die Zone ist ungültig.");
      zone.push(parsed);
    }
  }

  let boxes: { lat: number; lng: number }[] | null = null;
  if (body.boxes !== undefined) {
    if (!Array.isArray(body.boxes) || body.boxes.length > LIMITS.maxBoxes) {
      return fail(400, `Es gehen höchstens ${LIMITS.maxBoxes} Kisten.`);
    }
    boxes = [];
    for (const box of body.boxes) {
      const parsed = parseLatLng(box?.lat, box?.lng);
      if (!parsed) return fail(400, "Eine Kiste hat keinen gültigen Standort.");
      boxes.push({ lat: parsed[0], lng: parsed[1] });
    }
  }

  if (name) game.name = name;
  if (zone) game.zone = zone;
  if (boxes) {
    game.boxes = boxes.map((b, index) => ({ id: randomUUID(), label: `Kiste ${index + 1}`, ...b }));
  }
  game.durationMinutes = clampInt(body.durationMinutes, 5, 480) ?? game.durationMinutes;
  game.revealLastCount = clampInt(body.revealLastCount, 0, 20) ?? game.revealLastCount;
  game.revealLastMinutes = clampInt(body.revealLastMinutes, 0, 120) ?? game.revealLastMinutes;
  game.revealIntervalSec = clampInt(body.revealIntervalSec, 60, 1800) ?? game.revealIntervalSec;
  save();

  return NextResponse.json({ ok: true });
}
