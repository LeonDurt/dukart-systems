import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authPlayer,
  clampInt,
  cleanText,
  fail,
  parseLatLng,
  publicInfo,
} from "@/lib/fangen/server";
import type { LatLng } from "@/lib/fangen/geo";
import { LIMITS } from "@/lib/fangen/types";

type Params = { params: Promise<{ code: string }> };

// GET: öffentliche Kurzinfo für den Einladungslink (ohne Standorte, ohne Namen der Mitspieler).
export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const info = await publicInfo(code);
  if (!info) return fail(404, "Dieses Spiel gibt es nicht (mehr).");
  return NextResponse.json(info);
}

// PATCH: Host stellt in der Lobby Zone, Kisten und Zeiten ein.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const auth = await authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht in diesem Spiel.");
  const { game, player } = auth;
  if (!player.isHost) return fail(403, "Nur der Host kann das Spiel einstellen.");
  if (game.status !== "LOBBY") return fail(409, "Einstellungen gehen nur vor dem Start.");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return fail(400, "Ungültige Anfrage.");

  const data: {
    name?: string;
    zone?: LatLng[];
    durationMinutes?: number;
    revealLastCount?: number;
    revealLastMinutes?: number;
    revealIntervalSec?: number;
  } = {};

  if (body.name !== undefined) {
    const name = cleanText(body.name, LIMITS.gameNameLength);
    if (!name) return fail(400, "Der Spielname darf nicht leer sein.");
    data.name = name;
  }

  if (body.zone !== undefined) {
    if (!Array.isArray(body.zone) || body.zone.length > LIMITS.maxZonePoints) {
      return fail(400, "Die Zone ist ungültig.");
    }
    const zone: LatLng[] = [];
    for (const point of body.zone) {
      const parsed = Array.isArray(point) ? parseLatLng(point[0], point[1]) : null;
      if (!parsed) return fail(400, "Die Zone ist ungültig.");
      zone.push(parsed);
    }
    data.zone = zone;
  }

  const duration = clampInt(body.durationMinutes, 5, 480);
  if (duration !== null) data.durationMinutes = duration;
  const lastCount = clampInt(body.revealLastCount, 0, 20);
  if (lastCount !== null) data.revealLastCount = lastCount;
  const lastMinutes = clampInt(body.revealLastMinutes, 0, 120);
  if (lastMinutes !== null) data.revealLastMinutes = lastMinutes;
  const interval = clampInt(body.revealIntervalSec, 60, 1800);
  if (interval !== null) data.revealIntervalSec = interval;

  let boxes: { label: string; lat: number; lng: number }[] | null = null;
  if (body.boxes !== undefined) {
    if (!Array.isArray(body.boxes) || body.boxes.length > LIMITS.maxBoxes) {
      return fail(400, `Es gehen höchstens ${LIMITS.maxBoxes} Kisten.`);
    }
    boxes = [];
    for (const [index, box] of body.boxes.entries()) {
      const parsed = parseLatLng(box?.lat, box?.lng);
      if (!parsed) return fail(400, "Eine Kiste hat keinen gültigen Standort.");
      boxes.push({ label: `Kiste ${index + 1}`, lat: parsed[0], lng: parsed[1] });
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.tagGame.update({ where: { id: game.id }, data });
    }
    if (boxes) {
      await tx.tagBox.deleteMany({ where: { gameId: game.id } });
      if (boxes.length > 0) {
        await tx.tagBox.createMany({ data: boxes.map((b) => ({ ...b, gameId: game.id })) });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
