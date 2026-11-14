import { NextRequest, NextResponse } from "next/server";
import { distanceMeters } from "@/lib/geo";
import {
  addEvent,
  authPlayer,
  fail,
  finishGame,
  markCaught,
  parseLatLng,
  removePlayer,
} from "@/lib/server";
import { save } from "@/lib/store";
import { LIMITS } from "@/lib/types";

const ok = () => NextResponse.json({ ok: true });

// POST: alles, was den Spielverlauf ändert. Ein Endpunkt, damit die Regeln an einer Stelle stehen.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht in diesem Spiel.");
  const { game, player } = auth;

  const body = await req.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type : "";
  const targetId = typeof body?.playerId === "string" ? body.playerId : null;
  const target = targetId ? (game.players.find((p) => p.id === targetId) ?? null) : null;

  switch (type) {
    // Host legt fest, wer als Fänger startet
    case "setCatchers": {
      if (!player.isHost) return fail(403, "Nur der Host teilt die Fänger ein.");
      if (game.status !== "LOBBY") return fail(409, "Das geht nur vor dem Start.");
      const ids = new Set<unknown>(Array.isArray(body?.playerIds) ? body.playerIds : []);
      for (const p of game.players) {
        const catcher = ids.has(p.id);
        p.role = catcher ? "CATCHER" : "RUNNER";
        p.firstCatcher = catcher;
      }
      save();
      return ok();
    }

    case "start": {
      if (!player.isHost) return fail(403, "Nur der Host startet das Spiel.");
      if (game.status !== "LOBBY") return fail(409, "Das Spiel läuft schon.");
      if (game.zone.length < 3) return fail(400, "Zeichne zuerst die Zone auf der Karte ein.");
      if (game.boxes.length === 0) return fail(400, "Setze mindestens eine Kiste mit Leibchen.");
      const catchers = game.players.filter((p) => p.role === "CATCHER");
      if (catchers.length === 0) return fail(400, "Teile zuerst einen Fänger ein.");
      if (catchers.length === game.players.length) return fail(400, "Es braucht mindestens einen Läufer.");

      const now = Date.now();
      game.status = "RUNNING";
      game.startedAt = now;
      game.endsAt = now + game.durationMinutes * 60_000;
      // Die ersten Fänger starten mit Leibchen.
      for (const p of catchers) p.vestAt = now;
      addEvent(game, "started", `Los geht's! ${catchers.map((p) => p.name).join(", ")} fängt. Alle anderen: lauft!`);
      return ok();
    }

    // Host bricht ab
    case "end": {
      if (!player.isHost) return fail(403, "Nur der Host kann das Spiel beenden.");
      finishGame(game, null, "Der Host hat das Spiel beendet.");
      return ok();
    }

    // "Ich wurde gefangen"
    case "caught": {
      if (game.status !== "RUNNING") return fail(409, "Das Spiel läuft gerade nicht.");
      if (player.role !== "RUNNER") return fail(409, "Du bist schon Fänger.");
      markCaught(game, player, target?.role === "CATCHER" ? target.id : null);
      return ok();
    }

    // Host trägt jemanden nach, der sich nicht selbst gemeldet hat
    case "markCaught": {
      if (!player.isHost) return fail(403, "Nur der Host kann das.");
      if (game.status !== "RUNNING") return fail(409, "Das Spiel läuft gerade nicht.");
      if (!target) return fail(404, "Spieler nicht gefunden.");
      markCaught(game, target, null);
      return ok();
    }

    // "Leibchen angezogen"
    case "vest": {
      if (game.status !== "RUNNING") return fail(409, "Das Spiel läuft gerade nicht.");
      const forOther = targetId !== null && targetId !== player.id;
      if (forOther) {
        if (!player.isHost) return fail(403, "Nur der Host kann das für andere bestätigen.");
        if (!target) return fail(404, "Spieler nicht gefunden.");
      }
      const who = forOther && target ? target : player;
      if (who.role !== "CATCHER" || who.vestAt) return ok();

      // Wer selbst bestätigt, muss wirklich an einer Kiste stehen (soweit das GPS es hergibt).
      // Der Standort kommt mit der Anfrage, weil der letzte Sync ein paar Sekunden alt sein kann.
      if (!forOther) {
        const sent = parseLatLng(body?.lat, body?.lng);
        const fresh = who.locationAt !== null && Date.now() - who.locationAt < 60_000;
        const position = sent ?? (fresh ? parseLatLng(who.lat, who.lng) : null);
        if (position) {
          const accuracy = sent && typeof body.accuracy === "number" ? body.accuracy : (who.accuracy ?? 0);
          const allowed = LIMITS.vestRadiusMeters + Math.min(Math.max(accuracy, 0), 100);
          const near = game.boxes.some((box) => distanceMeters(position, [box.lat, box.lng]) <= allowed);
          if (!near) return fail(409, "Du bist noch nicht an einer Kiste.");
        }
      }

      who.vestAt = Date.now();
      addEvent(game, "vest", `${who.name} trägt jetzt ein Leibchen und fängt mit.`);
      return ok();
    }

    case "kick": {
      if (!player.isHost) return fail(403, "Nur der Host kann Spieler entfernen.");
      if (!target) return fail(404, "Spieler nicht gefunden.");
      if (target.id === player.id) return fail(400, "Du kannst dich nicht selbst entfernen.");
      removePlayer(game, target);
      if (game.status === "RUNNING") addEvent(game, "left", `${target.name} ist nicht mehr dabei.`);
      return ok();
    }

    // Neue Runde mit denselben Leuten, derselben Zone und denselben Kisten
    case "rematch": {
      if (!player.isHost) return fail(403, "Nur der Host startet eine neue Runde.");
      if (game.status !== "FINISHED") return fail(409, "Das Spiel läuft noch.");
      game.status = "LOBBY";
      game.startedAt = game.endsAt = game.endgameStartedAt = game.finishedAt = null;
      game.lastRevealSlot = -1;
      game.winner = null;
      game.events = [];
      for (const p of game.players) {
        p.role = "RUNNER";
        p.firstCatcher = false;
        p.caughtAt = p.caughtById = p.vestAt = null;
        p.outsideZone = false;
      }
      save();
      return ok();
    }

    default:
      return fail(400, "Unbekannte Aktion.");
  }
}
