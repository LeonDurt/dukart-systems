// Serverlogik für das Fangen Spiel: Anmeldung per Geräte-Token, Spieluhr, Signal, Sichtbarkeit.

import { createHash, randomBytes, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma, TagBox, TagGame, TagPlayer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LatLng } from "./geo";
import type { GameDto, GameState, PlayerDto, PublicGameInfo } from "./types";

export const TOKEN_HEADER = "x-fangen-token";

/** Ohne 0/O, 1/I/L: lässt sich auf der Straße zurufen, ohne dass sich jemand vertippt. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const GPS_FRESH_MS = 60_000;

export type GameWithBoxes = TagGame & { boxes: TagBox[] };

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): { token: string; tokenHash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export async function newGameCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    const taken = await prisma.tagGame.findUnique({ where: { code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Kein freier Spielcode gefunden.");
}

/** Namen und Texte: Steuerzeichen raus, Leerraum zusammenziehen, kürzen. */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function parseLatLng(lat: unknown, lng: unknown): LatLng | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export function clampInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function zoneOf(game: TagGame): LatLng[] {
  return Array.isArray(game.zone) ? (game.zone as unknown as LatLng[]) : [];
}

/** Liest das Geräte-Token aus dem Header und prüft, dass es zu diesem Spiel gehört. */
export async function authPlayer(
  req: NextRequest,
  rawCode: string
): Promise<{ game: GameWithBoxes; player: TagPlayer } | null> {
  const token = req.headers.get(TOKEN_HEADER);
  if (!token || token.length > 200) return null;
  const found = await prisma.tagPlayer.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { game: { include: { boxes: true } } },
  });
  if (!found || found.game.code !== normalizeCode(rawCode)) return null;
  const { game, ...player } = found;
  return { game, player };
}

export function addEvent(gameId: string, type: string, text: string) {
  return prisma.tagEvent.create({ data: { gameId, type, text } });
}

/**
 * Macht einen Läufer zum Fänger. Die Bedingung role=RUNNER verhindert,
 * dass zwei gleichzeitige Meldungen doppelt zählen.
 */
export async function markCaught(
  game: TagGame,
  target: TagPlayer,
  caughtById: string | null
): Promise<boolean> {
  const result = await prisma.tagPlayer.updateMany({
    where: { id: target.id, role: "RUNNER" },
    data: { role: "CATCHER", caughtAt: new Date(), caughtById, vestAt: null },
  });
  if (result.count === 0) return false;
  await addEvent(game.id, "caught", `${target.name} wurde gefangen und holt sich ein Leibchen.`);
  return true;
}

/**
 * Spieluhr. Wird bei jedem Sync aufgerufen und schreibt nur bei einem Übergang:
 * Spielende, Start der Endphase, nächstes Signal. Alle Übergänge sind über
 * updateMany mit Bedingung abgesichert, damit sie bei vielen gleichzeitigen
 * Syncs genau einmal passieren.
 */
export async function tickGame(game: TagGame, players: TagPlayer[]): Promise<boolean> {
  if (game.status !== "RUNNING" || !game.endsAt) return false;
  const now = Date.now();
  const runners = players.filter((p) => p.role === "RUNNER");

  const finish = async (winner: "RUNNER" | "CATCHER", text: string) => {
    const done = await prisma.tagGame.updateMany({
      where: { id: game.id, status: "RUNNING" },
      data: { status: "FINISHED", finishedAt: new Date(), winner },
    });
    if (done.count === 1) {
      await addEvent(game.id, "finished", text);
      await clearLocations(game.id);
    }
    return true;
  };

  if (runners.length === 0) {
    return finish("CATCHER", "Alle gefangen. Die Fänger gewinnen!");
  }
  if (now >= game.endsAt.getTime()) {
    const names = runners.map((p) => p.name).join(", ");
    return finish("RUNNER", `Zeit abgelaufen. Nicht gefangen: ${names}.`);
  }

  let changed = false;
  let endgameStartedAt = game.endgameStartedAt;

  if (!endgameStartedAt) {
    const anyoneCaught = players.some((p) => p.caughtAt !== null);
    const byCount =
      game.revealLastCount > 0 && anyoneCaught && runners.length <= game.revealLastCount;
    // Höchstens die halbe Spieldauer, sonst wäre eine kurze Runde von Anfang an Endphase.
    const lastMinutes = Math.min(game.revealLastMinutes, Math.floor(game.durationMinutes / 2));
    const byTime = lastMinutes > 0 && game.endsAt.getTime() - now <= lastMinutes * 60_000;
    if (byCount || byTime) {
      const started = new Date();
      const claimed = await prisma.tagGame.updateMany({
        where: { id: game.id, endgameStartedAt: null },
        data: { endgameStartedAt: started },
      });
      if (claimed.count === 1) {
        await addEvent(
          game.id,
          "endgame",
          byCount
            ? `Endphase! Nur noch ${runners.length} übrig. Ab jetzt gibt es Signale.`
            : `Endphase! Die letzten ${lastMinutes} Minuten laufen. Ab jetzt gibt es Signale.`
        );
      }
      endgameStartedAt = started;
      changed = true;
    }
  }

  if (endgameStartedAt) {
    const slot = Math.floor((now - endgameStartedAt.getTime()) / (game.revealIntervalSec * 1000));
    if (slot > game.lastRevealSlot) {
      const claimed = await prisma.tagGame.updateMany({
        where: { id: game.id, lastRevealSlot: { lt: slot } },
        data: { lastRevealSlot: slot },
      });
      if (claimed.count === 1) {
        // Bewusst der zuletzt bekannte Standort, auch wenn er alt ist:
        // GPS ausschalten soll kein Schlupfloch sein.
        await prisma.$executeRaw`
          UPDATE "TagPlayer"
          SET "revealLat" = "lat", "revealLng" = "lng", "revealAt" = "locationAt"
          WHERE "gameId" = ${game.id} AND "role" = 'RUNNER' AND "lat" IS NOT NULL`;
        await addEvent(game.id, "signal", "Signal! Die Fänger sehen jetzt, wo die letzten Läufer sind.");
      }
      changed = true;
    }
  }

  return changed;
}

/** Standorte werden nur während des Spiels gebraucht und danach gelöscht. */
export function clearLocations(gameId: string) {
  return prisma.tagPlayer.updateMany({
    where: { gameId },
    data: {
      lat: null,
      lng: null,
      accuracy: null,
      locationAt: null,
      revealLat: null,
      revealLng: null,
      revealAt: null,
      outsideZone: false,
    },
  });
}

export function toGameDto(game: GameWithBoxes): GameDto {
  return {
    code: game.code,
    name: game.name,
    status: game.status,
    zone: zoneOf(game),
    boxes: game.boxes
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, "de"))
      .map((b) => ({ id: b.id, label: b.label, lat: b.lat, lng: b.lng })),
    durationMinutes: game.durationMinutes,
    revealLastCount: game.revealLastCount,
    revealLastMinutes: game.revealLastMinutes,
    revealIntervalSec: game.revealIntervalSec,
    startedAt: game.startedAt?.getTime() ?? null,
    endsAt: game.endsAt?.getTime() ?? null,
    finishedAt: game.finishedAt?.getTime() ?? null,
    winner: game.winner,
  };
}

/**
 * Wer sieht wen? Die Regel sitzt bewusst auf dem Server, damit sich niemand
 * über die Browser Konsole fremde Standorte holen kann.
 *   Läufer: sehen niemanden.
 *   Fänger: sehen die anderen Fänger live und Läufer nur über das Signal.
 */
function toPlayerDto(p: TagPlayer, viewer: TagPlayer, game: TagGame, now: number): PlayerDto {
  const dto: PlayerDto = {
    id: p.id,
    name: p.name,
    role: p.role,
    isHost: p.isHost,
    firstCatcher: p.firstCatcher,
    caughtAt: p.caughtAt?.getTime() ?? null,
    caughtById: p.caughtById,
    vestAt: p.vestAt?.getTime() ?? null,
    gpsOk: p.locationAt !== null && now - p.locationAt.getTime() < GPS_FRESH_MS,
    outsideZone: p.outsideZone,
  };
  if (game.status !== "RUNNING" || viewer.role !== "CATCHER" || p.id === viewer.id) return dto;
  if (p.role === "CATCHER" && p.lat !== null && p.lng !== null && p.locationAt) {
    dto.pos = { lat: p.lat, lng: p.lng, at: p.locationAt.getTime() };
  }
  if (p.role === "RUNNER" && p.revealLat !== null && p.revealLng !== null) {
    dto.reveal = {
      lat: p.revealLat,
      lng: p.revealLng,
      at: (p.revealAt ?? game.endgameStartedAt ?? new Date(now)).getTime(),
    };
  }
  return dto;
}

export async function buildState(
  gameId: string,
  playerId: string,
  afterMessageId: number
): Promise<GameState | null> {
  let [game, players] = await Promise.all([
    prisma.tagGame.findUnique({ where: { id: gameId }, include: { boxes: true } }),
    prisma.tagPlayer.findMany({ where: { gameId }, orderBy: { joinedAt: "asc" } }),
  ]);
  if (!game) return null;

  if (await tickGame(game, players)) {
    [game, players] = await Promise.all([
      prisma.tagGame.findUnique({ where: { id: gameId }, include: { boxes: true } }),
      prisma.tagPlayer.findMany({ where: { gameId }, orderBy: { joinedAt: "asc" } }),
    ]);
    if (!game) return null;
  }

  const viewer = players.find((p) => p.id === playerId);
  if (!viewer) return null;

  const channels: Prisma.TagMessageWhereInput["channel"] =
    viewer.role === "CATCHER" ? { in: ["ALL", "CATCHERS"] } : "ALL";

  const [events, messages] = await Promise.all([
    prisma.tagEvent.findMany({ where: { gameId }, orderBy: { id: "desc" }, take: 30 }),
    prisma.tagMessage.findMany({
      where: { gameId, id: { gt: afterMessageId }, channel: channels },
      orderBy: { id: "desc" },
      take: 200,
      include: { player: { select: { name: true } } },
    }),
  ]);

  const now = Date.now();
  const running = game.status === "RUNNING";
  const endgameActive = running && game.endgameStartedAt !== null;

  return {
    serverNow: now,
    game: toGameDto(game),
    meId: viewer.id,
    players: players.map((p) => toPlayerDto(p, viewer, game!, now)),
    endgame: {
      active: endgameActive,
      nextSignalAt:
        endgameActive && game.endgameStartedAt
          ? game.endgameStartedAt.getTime() +
            (game.lastRevealSlot + 1) * game.revealIntervalSec * 1000
          : null,
    },
    events: events.map((e) => ({ id: e.id, type: e.type, text: e.text, at: e.createdAt.getTime() })),
    messages: messages
      .reverse()
      .map((m) => ({
        id: m.id,
        channel: m.channel,
        playerId: m.playerId,
        name: m.player.name,
        text: m.text,
        at: m.createdAt.getTime(),
      })),
  };
}

export async function publicInfo(rawCode: string): Promise<PublicGameInfo | null> {
  const game = await prisma.tagGame.findUnique({
    where: { code: normalizeCode(rawCode) },
    include: { players: { select: { name: true, isHost: true } } },
  });
  if (!game) return null;
  return {
    code: game.code,
    name: game.name,
    status: game.status,
    playerCount: game.players.length,
    hostName: game.players.find((p) => p.isHost)?.name ?? null,
  };
}

/** Alte Spiele samt Standorten aufräumen. Läuft nebenbei beim Erstellen eines neuen Spiels. */
export async function purgeOldGames() {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  await prisma.tagGame.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
