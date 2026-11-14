// Serverlogik für das Fangen Spiel: Anmeldung per Geräte-Token, Spieluhr, Signal, Sichtbarkeit.

import { createHash, randomBytes, randomInt, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { LatLng } from "./geo";
import { getStore, save, type Game, type Player } from "./store";
import type { GameDto, GameState, PlayerDto, PublicGameInfo } from "./types";

export const TOKEN_HEADER = "x-fangen-token";

/** Ohne 0/O, 1/I/L: lässt sich auf der Straße zurufen, ohne dass sich jemand vertippt. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const GPS_FRESH_MS = 60_000;
const MAX_EVENTS = 200;
const MAX_MESSAGES = 2000;

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

export function newGameCode(): string {
  const { games } = getStore();
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    if (!games.has(code)) return code;
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

export function findGame(rawCode: string): Game | null {
  return getStore().games.get(normalizeCode(rawCode)) ?? null;
}

export function createGame(name: string, hostName: string): { game: Game; token: string } {
  const store = getStore();
  const { token, tokenHash } = newToken();
  const game: Game = {
    code: newGameCode(),
    name,
    status: "LOBBY",
    zone: [],
    durationMinutes: 240,
    revealLastCount: 3,
    revealLastMinutes: 30,
    revealIntervalSec: 300,
    startedAt: null,
    endsAt: null,
    endgameStartedAt: null,
    lastRevealSlot: -1,
    finishedAt: null,
    winner: null,
    createdAt: Date.now(),
    players: [],
    boxes: [],
    messages: [],
    events: [],
    nextId: 1,
  };
  store.games.set(game.code, game);
  const host = addPlayer(game, hostName, tokenHash);
  host.isHost = true;
  save();
  return { game, token };
}

export function addPlayer(game: Game, name: string, tokenHash: string): Player {
  const player: Player = {
    id: randomUUID(),
    name,
    tokenHash,
    role: "RUNNER",
    isHost: false,
    firstCatcher: false,
    caughtAt: null,
    caughtById: null,
    vestAt: null,
    lat: null,
    lng: null,
    accuracy: null,
    locationAt: null,
    outsideZone: false,
    revealLat: null,
    revealLng: null,
    revealAt: null,
    joinedAt: Date.now(),
  };
  game.players.push(player);
  getStore().tokens.set(tokenHash, { code: game.code, playerId: player.id });
  save();
  return player;
}

export function removePlayer(game: Game, player: Player) {
  game.players = game.players.filter((p) => p.id !== player.id);
  getStore().tokens.delete(player.tokenHash);
  save();
}

/** Liest das Geräte-Token aus dem Header und prüft, dass es zu diesem Spiel gehört. */
export function authPlayer(req: NextRequest, rawCode: string): { game: Game; player: Player } | null {
  const token = req.headers.get(TOKEN_HEADER);
  if (!token || token.length > 200) return null;
  const entry = getStore().tokens.get(hashToken(token));
  if (!entry || entry.code !== normalizeCode(rawCode)) return null;
  const game = getStore().games.get(entry.code);
  const player = game?.players.find((p) => p.id === entry.playerId);
  return game && player ? { game, player } : null;
}

export function addEvent(game: Game, type: string, text: string) {
  game.events.push({ id: game.nextId++, type, text, at: Date.now() });
  if (game.events.length > MAX_EVENTS) game.events.splice(0, game.events.length - MAX_EVENTS);
  save();
}

export function addMessage(game: Game, player: Player, channel: "ALL" | "CATCHERS", text: string) {
  game.messages.push({ id: game.nextId++, playerId: player.id, name: player.name, channel, text, at: Date.now() });
  if (game.messages.length > MAX_MESSAGES) game.messages.splice(0, game.messages.length - MAX_MESSAGES);
  save();
}

/** Macht einen Läufer zum Fänger. */
export function markCaught(game: Game, target: Player, caughtById: string | null): boolean {
  if (target.role !== "RUNNER") return false;
  target.role = "CATCHER";
  target.caughtAt = Date.now();
  target.caughtById = caughtById;
  target.vestAt = null;
  addEvent(game, "caught", `${target.name} wurde gefangen und holt sich ein Leibchen.`);
  return true;
}

/** Standorte werden nur während des Spiels gebraucht und danach gelöscht. */
export function clearLocations(game: Game) {
  for (const p of game.players) {
    p.lat = p.lng = p.accuracy = p.locationAt = null;
    p.revealLat = p.revealLng = p.revealAt = null;
    p.outsideZone = false;
  }
  save();
}

export function finishGame(game: Game, winner: "RUNNER" | "CATCHER" | null, text: string) {
  if (game.status !== "RUNNING") return;
  game.status = "FINISHED";
  game.finishedAt = Date.now();
  game.winner = winner;
  addEvent(game, "finished", text);
  clearLocations(game);
}

/**
 * Spieluhr. Wird bei jedem Sync aufgerufen und ändert nur bei einem Übergang etwas:
 * Spielende, Start der Endphase, nächstes Signal.
 */
export function tickGame(game: Game) {
  if (game.status !== "RUNNING" || !game.endsAt) return;
  const now = Date.now();
  const runners = game.players.filter((p) => p.role === "RUNNER");

  if (runners.length === 0) {
    finishGame(game, "CATCHER", "Alle gefangen. Die Fänger gewinnen!");
    return;
  }
  if (now >= game.endsAt) {
    finishGame(game, "RUNNER", `Zeit abgelaufen. Nicht gefangen: ${runners.map((p) => p.name).join(", ")}.`);
    return;
  }

  if (!game.endgameStartedAt) {
    const anyoneCaught = game.players.some((p) => p.caughtAt !== null);
    const byCount = game.revealLastCount > 0 && anyoneCaught && runners.length <= game.revealLastCount;
    // Höchstens die halbe Spieldauer, sonst wäre eine kurze Runde von Anfang an Endphase.
    const lastMinutes = Math.min(game.revealLastMinutes, Math.floor(game.durationMinutes / 2));
    const byTime = lastMinutes > 0 && game.endsAt - now <= lastMinutes * 60_000;
    if (byCount || byTime) {
      game.endgameStartedAt = now;
      addEvent(
        game,
        "endgame",
        byCount
          ? `Endphase! Nur noch ${runners.length} übrig. Ab jetzt gibt es Signale.`
          : `Endphase! Die letzten ${lastMinutes} Minuten laufen. Ab jetzt gibt es Signale.`
      );
    }
  }

  if (game.endgameStartedAt) {
    const slot = Math.floor((now - game.endgameStartedAt) / (game.revealIntervalSec * 1000));
    if (slot > game.lastRevealSlot) {
      game.lastRevealSlot = slot;
      // Bewusst der zuletzt bekannte Standort, auch wenn er alt ist:
      // GPS ausschalten soll kein Schlupfloch sein.
      for (const p of runners) {
        if (p.lat === null || p.lng === null) continue;
        p.revealLat = p.lat;
        p.revealLng = p.lng;
        p.revealAt = p.locationAt;
      }
      addEvent(game, "signal", "Signal! Die Fänger sehen jetzt, wo die letzten Läufer sind.");
    }
  }
}

export function toGameDto(game: Game): GameDto {
  return {
    code: game.code,
    name: game.name,
    status: game.status,
    zone: game.zone,
    boxes: game.boxes,
    durationMinutes: game.durationMinutes,
    revealLastCount: game.revealLastCount,
    revealLastMinutes: game.revealLastMinutes,
    revealIntervalSec: game.revealIntervalSec,
    startedAt: game.startedAt,
    endsAt: game.endsAt,
    finishedAt: game.finishedAt,
    winner: game.winner,
  };
}

/**
 * Wer sieht wen? Die Regel sitzt bewusst auf dem Server, damit sich niemand
 * über die Browser Konsole fremde Standorte holen kann.
 *   Läufer: sehen niemanden.
 *   Fänger: sehen die anderen Fänger live und Läufer nur über das Signal.
 */
function toPlayerDto(p: Player, viewer: Player, game: Game, now: number): PlayerDto {
  const dto: PlayerDto = {
    id: p.id,
    name: p.name,
    role: p.role,
    isHost: p.isHost,
    firstCatcher: p.firstCatcher,
    caughtAt: p.caughtAt,
    caughtById: p.caughtById,
    vestAt: p.vestAt,
    gpsOk: p.locationAt !== null && now - p.locationAt < GPS_FRESH_MS,
    outsideZone: p.outsideZone,
  };
  if (game.status !== "RUNNING" || viewer.role !== "CATCHER" || p.id === viewer.id) return dto;
  if (p.role === "CATCHER" && p.lat !== null && p.lng !== null && p.locationAt) {
    dto.pos = { lat: p.lat, lng: p.lng, at: p.locationAt };
  }
  if (p.role === "RUNNER" && p.revealLat !== null && p.revealLng !== null) {
    dto.reveal = { lat: p.revealLat, lng: p.revealLng, at: p.revealAt ?? game.endgameStartedAt ?? now };
  }
  return dto;
}

export function buildState(game: Game, viewer: Player, afterMessageId: number): GameState {
  tickGame(game);
  const now = Date.now();
  const endgameActive = game.status === "RUNNING" && game.endgameStartedAt !== null;
  return {
    serverNow: now,
    game: toGameDto(game),
    meId: viewer.id,
    players: game.players.map((p) => toPlayerDto(p, viewer, game, now)),
    endgame: {
      active: endgameActive,
      nextSignalAt:
        endgameActive && game.endgameStartedAt
          ? game.endgameStartedAt + (game.lastRevealSlot + 1) * game.revealIntervalSec * 1000
          : null,
    },
    // Neueste zuerst
    events: game.events.slice(-30).reverse(),
    messages: game.messages
      .filter((m) => m.id > afterMessageId && (m.channel === "ALL" || viewer.role === "CATCHER"))
      .slice(-200),
  };
}

export function publicInfo(rawCode: string): PublicGameInfo | null {
  const game = findGame(rawCode);
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
export function purgeOldGames() {
  const store = getStore();
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  for (const game of [...store.games.values()]) {
    if (game.createdAt >= cutoff) continue;
    for (const p of game.players) store.tokens.delete(p.tokenHash);
    store.games.delete(game.code);
  }
  save();
}
