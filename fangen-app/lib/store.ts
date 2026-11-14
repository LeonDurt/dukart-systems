// Der komplette Spielstand liegt im Arbeitsspeicher. Keine Datenbank nötig.
// Damit ein Neustart mitten im Spiel nichts kaputt macht, wird der Stand
// nebenbei in data/spiele.json gesichert und beim Start wieder geladen.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import type { LatLng } from "./geo";
import type { Channel, GameStatus, PlayerRole } from "./types";

export type Player = {
  id: string;
  name: string;
  tokenHash: string;
  role: PlayerRole;
  isHost: boolean;
  firstCatcher: boolean;
  caughtAt: number | null;
  caughtById: string | null;
  /** Leibchen aus der Kiste geholt */
  vestAt: number | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  locationAt: number | null;
  outsideZone: boolean;
  revealLat: number | null;
  revealLng: number | null;
  revealAt: number | null;
  joinedAt: number;
};

export type Box = { id: string; label: string; lat: number; lng: number };
export type Message = { id: number; playerId: string; name: string; channel: Channel; text: string; at: number };
export type GameEvent = { id: number; type: string; text: string; at: number };

export type Game = {
  code: string;
  name: string;
  status: GameStatus;
  /** Eckpunkte der Spielzone */
  zone: LatLng[];
  durationMinutes: number;
  /** Signal, sobald nur noch so viele Läufer übrig sind */
  revealLastCount: number;
  /** Signal in den letzten Minuten */
  revealLastMinutes: number;
  /** Abstand zwischen zwei Signalen */
  revealIntervalSec: number;
  startedAt: number | null;
  endsAt: number | null;
  endgameStartedAt: number | null;
  lastRevealSlot: number;
  finishedAt: number | null;
  winner: PlayerRole | null;
  createdAt: number;
  players: Player[];
  boxes: Box[];
  messages: Message[];
  events: GameEvent[];
  nextId: number;
};

type Store = {
  games: Map<string, Game>;
  /** tokenHash → wo der Spieler steckt */
  tokens: Map<string, { code: string; playerId: string }>;
  saveTimer: ReturnType<typeof setTimeout> | null;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "spiele.json");
const SAVE_DELAY_MS = 1500;

function load(): Store {
  const store: Store = { games: new Map(), tokens: new Map(), saveTimer: null };
  try {
    if (existsSync(DATA_FILE)) {
      const games = JSON.parse(readFileSync(DATA_FILE, "utf8")) as Game[];
      for (const game of games) {
        store.games.set(game.code, game);
        for (const player of game.players) {
          store.tokens.set(player.tokenHash, { code: game.code, playerId: player.id });
        }
      }
    }
  } catch (err) {
    console.error("Gespeicherte Spiele konnten nicht geladen werden, starte leer.", err);
  }
  return store;
}

// globalThis, damit alle Routen denselben Stand sehen (auch nach einem Hot Reload).
const holder = globalThis as unknown as { __fangenStore?: Store };

export function getStore(): Store {
  if (!holder.__fangenStore) holder.__fangenStore = load();
  return holder.__fangenStore;
}

/** Nach jeder Änderung aufrufen. Schreibt gebündelt, nicht bei jedem Standort einzeln. */
export function save() {
  const store = getStore();
  if (store.saveTimer) return;
  store.saveTimer = setTimeout(() => {
    store.saveTimer = null;
    try {
      mkdirSync(DATA_DIR, { recursive: true });
      const tmp = `${DATA_FILE}.tmp`;
      writeFileSync(tmp, JSON.stringify([...store.games.values()]));
      renameSync(tmp, DATA_FILE);
    } catch (err) {
      console.error("Spielstand konnte nicht gesichert werden.", err);
    }
  }, SAVE_DELAY_MS);
}
