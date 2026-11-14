import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distanceMeters } from "@/lib/fangen/geo";
import {
  addEvent,
  authPlayer,
  clearLocations,
  fail,
  markCaught,
  parseLatLng,
  zoneOf,
} from "@/lib/fangen/server";
import { LIMITS } from "@/lib/fangen/types";

const ok = () => NextResponse.json({ ok: true });

// POST: alles, was den Spielverlauf ändert. Ein Endpunkt, damit die Regeln an einer Stelle stehen.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = await authPlayer(req, code);
  if (!auth) return fail(401, "Du bist nicht in diesem Spiel.");
  const { game, player } = auth;

  const body = await req.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type : "";
  const targetId = typeof body?.playerId === "string" ? body.playerId : null;

  const findTarget = async () =>
    targetId
      ? prisma.tagPlayer.findFirst({ where: { id: targetId, gameId: game.id } })
      : null;

  switch (type) {
    // Regeln angesehen
    case "intro": {
      await prisma.tagPlayer.update({ where: { id: player.id }, data: { introSeenAt: new Date() } });
      return ok();
    }

    // Host legt fest, wer als Fänger startet
    case "setCatchers": {
      if (!player.isHost) return fail(403, "Nur der Host teilt die Fänger ein.");
      if (game.status !== "LOBBY") return fail(409, "Das geht nur vor dem Start.");
      const ids: string[] = Array.isArray(body?.playerIds)
        ? body.playerIds.filter((id: unknown): id is string => typeof id === "string")
        : [];
      await prisma.$transaction([
        prisma.tagPlayer.updateMany({
          where: { gameId: game.id, id: { notIn: ids } },
          data: { role: "RUNNER", firstCatcher: false },
        }),
        prisma.tagPlayer.updateMany({
          where: { gameId: game.id, id: { in: ids } },
          data: { role: "CATCHER", firstCatcher: true },
        }),
      ]);
      return ok();
    }

    case "start": {
      if (!player.isHost) return fail(403, "Nur der Host startet das Spiel.");
      if (game.status !== "LOBBY") return fail(409, "Das Spiel läuft schon.");
      if (zoneOf(game).length < 3) return fail(400, "Zeichne zuerst die Zone auf der Karte ein.");
      if (game.boxes.length === 0) return fail(400, "Setze mindestens eine Kiste mit Leibchen.");
      const players = await prisma.tagPlayer.findMany({ where: { gameId: game.id } });
      const catchers = players.filter((p) => p.role === "CATCHER");
      if (catchers.length === 0) return fail(400, "Teile zuerst einen Fänger ein.");
      if (players.length - catchers.length === 0) return fail(400, "Es braucht mindestens einen Läufer.");

      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + game.durationMinutes * 60_000);
      const started = await prisma.tagGame.updateMany({
        where: { id: game.id, status: "LOBBY" },
        data: { status: "RUNNING", startedAt, endsAt },
      });
      if (started.count === 1) {
        // Die ersten Fänger starten mit Leibchen.
        await prisma.tagPlayer.updateMany({
          where: { gameId: game.id, role: "CATCHER" },
          data: { vestAt: startedAt },
        });
        const names = catchers.map((p) => p.name).join(", ");
        await addEvent(game.id, "started", `Los geht's! ${names} fängt. Alle anderen: lauft!`);
      }
      return ok();
    }

    // Host bricht ab
    case "end": {
      if (!player.isHost) return fail(403, "Nur der Host kann das Spiel beenden.");
      const ended = await prisma.tagGame.updateMany({
        where: { id: game.id, status: "RUNNING" },
        data: { status: "FINISHED", finishedAt: new Date(), winner: null },
      });
      if (ended.count === 1) {
        await addEvent(game.id, "finished", "Der Host hat das Spiel beendet.");
        await clearLocations(game.id);
      }
      return ok();
    }

    // "Ich wurde gefangen"
    case "caught": {
      if (game.status !== "RUNNING") return fail(409, "Das Spiel läuft gerade nicht.");
      if (player.role !== "RUNNER") return fail(409, "Du bist schon Fänger.");
      const catcher = await findTarget();
      await markCaught(game, player, catcher?.role === "CATCHER" ? catcher.id : null);
      return ok();
    }

    // Host trägt jemanden nach, der sich nicht selbst gemeldet hat
    case "markCaught": {
      if (!player.isHost) return fail(403, "Nur der Host kann das.");
      if (game.status !== "RUNNING") return fail(409, "Das Spiel läuft gerade nicht.");
      const target = await findTarget();
      if (!target) return fail(404, "Spieler nicht gefunden.");
      await markCaught(game, target, null);
      return ok();
    }

    // "Leibchen angezogen"
    case "vest": {
      if (game.status !== "RUNNING") return fail(409, "Das Spiel läuft gerade nicht.");
      const other = targetId && targetId !== player.id ? await findTarget() : null;
      if (targetId && targetId !== player.id) {
        if (!player.isHost) return fail(403, "Nur der Host kann das für andere bestätigen.");
        if (!other) return fail(404, "Spieler nicht gefunden.");
      }
      const target = other ?? player;
      if (target.role !== "CATCHER" || target.vestAt) return ok();

      // Wer selbst bestätigt, muss wirklich an einer Kiste stehen (soweit das GPS es hergibt).
      // Der Standort kommt mit der Anfrage, weil der letzte Sync ein paar Sekunden alt sein kann.
      if (!other) {
        const sent = parseLatLng(body?.lat, body?.lng);
        const fresh = target.locationAt && Date.now() - target.locationAt.getTime() < 60_000;
        const stored = fresh ? parseLatLng(target.lat, target.lng) : null;
        const position = sent ?? stored;
        if (position) {
          const accuracy = sent && typeof body.accuracy === "number" ? body.accuracy : (target.accuracy ?? 0);
          const allowed = LIMITS.vestRadiusMeters + Math.min(Math.max(accuracy, 0), 100);
          const near = game.boxes.some(
            (box) => distanceMeters(position, [box.lat, box.lng]) <= allowed
          );
          if (!near) return fail(409, "Du bist noch nicht an einer Kiste.");
        }
      }

      const updated = await prisma.tagPlayer.updateMany({
        where: { id: target.id, vestAt: null },
        data: { vestAt: new Date() },
      });
      if (updated.count === 1) {
        await addEvent(game.id, "vest", `${target.name} trägt jetzt ein Leibchen und fängt mit.`);
      }
      return ok();
    }

    case "kick": {
      if (!player.isHost) return fail(403, "Nur der Host kann Spieler entfernen.");
      const target = await findTarget();
      if (!target) return fail(404, "Spieler nicht gefunden.");
      if (target.id === player.id) return fail(400, "Du kannst dich nicht selbst entfernen.");
      await prisma.tagPlayer.delete({ where: { id: target.id } });
      if (game.status === "RUNNING") {
        await addEvent(game.id, "left", `${target.name} ist nicht mehr dabei.`);
      }
      return ok();
    }

    // Neue Runde mit denselben Leuten, derselben Zone und denselben Kisten
    case "rematch": {
      if (!player.isHost) return fail(403, "Nur der Host startet eine neue Runde.");
      if (game.status !== "FINISHED") return fail(409, "Das Spiel läuft noch.");
      await prisma.$transaction([
        prisma.tagGame.update({
          where: { id: game.id },
          data: {
            status: "LOBBY",
            startedAt: null,
            endsAt: null,
            endgameStartedAt: null,
            lastRevealSlot: -1,
            finishedAt: null,
            winner: null,
          },
        }),
        prisma.tagPlayer.updateMany({
          where: { gameId: game.id },
          data: {
            role: "RUNNER",
            firstCatcher: false,
            caughtAt: null,
            caughtById: null,
            vestAt: null,
            outsideZone: false,
          },
        }),
        prisma.tagEvent.deleteMany({ where: { gameId: game.id } }),
      ]);
      return ok();
    }

    default:
      return fail(400, "Unbekannte Aktion.");
  }
}
