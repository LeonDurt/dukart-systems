// Gemeinsame Typen für Server und Client des Fangen Spiels.

import type { LatLng } from "./geo";

export type GameStatus = "LOBBY" | "RUNNING" | "FINISHED";
export type PlayerRole = "RUNNER" | "CATCHER";
export type Channel = "ALL" | "CATCHERS";

export type BoxDto = { id: string; label: string; lat: number; lng: number };

export type GameDto = {
  code: string;
  name: string;
  status: GameStatus;
  zone: LatLng[];
  boxes: BoxDto[];
  durationMinutes: number;
  revealLastCount: number;
  revealLastMinutes: number;
  revealIntervalSec: number;
  startedAt: number | null;
  endsAt: number | null;
  finishedAt: number | null;
  /** null bei FINISHED bedeutet: vom Host abgebrochen. */
  winner: PlayerRole | null;
};

export type PlayerDto = {
  id: string;
  name: string;
  role: PlayerRole;
  isHost: boolean;
  firstCatcher: boolean;
  caughtAt: number | null;
  caughtById: string | null;
  vestAt: number | null;
  /** Hat in der letzten Minute einen Standort gesendet. */
  gpsOk: boolean;
  outsideZone: boolean;
  /** Live Standort. Nur gesetzt, wenn der Betrachter ihn sehen darf. */
  pos?: { lat: number; lng: number; at: number };
  /** Standort aus dem letzten Signal. Nur für Fänger sichtbar. */
  reveal?: { lat: number; lng: number; at: number };
};

export type EventDto = { id: number; type: string; text: string; at: number };

export type MessageDto = {
  id: number;
  channel: Channel;
  playerId: string;
  name: string;
  text: string;
  at: number;
};

export type GameState = {
  serverNow: number;
  game: GameDto;
  meId: string;
  players: PlayerDto[];
  endgame: { active: boolean; nextSignalAt: number | null };
  events: EventDto[];
  messages: MessageDto[];
};

export type PublicGameInfo = {
  code: string;
  name: string;
  status: GameStatus;
  playerCount: number;
  hostName: string | null;
};

export const LIMITS = {
  maxPlayers: 60,
  maxBoxes: 6,
  maxZonePoints: 40,
  nameLength: 24,
  gameNameLength: 40,
  messageLength: 400,
  /** So nah muss man an einer Kiste sein, um das Leibchen zu bestätigen. */
  vestRadiusMeters: 75,
} as const;
