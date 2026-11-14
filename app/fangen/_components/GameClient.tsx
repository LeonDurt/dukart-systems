"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import type {
  Channel,
  GameState,
  MessageDto,
  PlayerDto,
  PlayerRole,
  PublicGameInfo,
} from "@/lib/fangen/types";
import { LIMITS } from "@/lib/fangen/types";
import { api, ApiError, store } from "./api";
import Finished from "./Finished";
import Intro from "./Intro";
import Lobby from "./Lobby";
import Running from "./Running";
import { Button, useNow } from "./ui";
import { useGeolocation, type Fix, type GeoError } from "./useGeolocation";

const SYNC_MS = 3000;

/** Alles, was die drei Spielansichten brauchen. */
export type SessionProps = {
  code: string;
  state: GameState;
  me: PlayerDto;
  /** Serverzeit, tickt jede Sekunde. */
  now: number;
  fix: Fix | null;
  geoError: GeoError;
  messages: MessageDto[];
  offline: boolean;
  videoUrl: string | null;
  act: (type: string, extra?: Record<string, unknown>) => Promise<void>;
  patch: (body: Record<string, unknown>) => Promise<void>;
  sendChat: (channel: Channel, text: string) => Promise<void>;
};

export default function GameClient({ code, videoUrl }: { code: string; videoUrl: string | null }) {
  const [token, setToken] = useState<string | null>(() => store.token(code));
  const [notice, setNotice] = useState<string | null>(null);

  const handleInvalid = useCallback(
    (message: string) => {
      store.setToken(code, null);
      setNotice(message);
      setToken(null);
    },
    [code]
  );

  if (!token) {
    return (
      <JoinFlow
        code={code}
        videoUrl={videoUrl}
        notice={notice}
        onJoined={(next) => {
          store.setToken(code, next);
          setNotice(null);
          setToken(next);
        }}
      />
    );
  }
  return <Session key={token} code={code} token={token} videoUrl={videoUrl} onInvalid={handleInvalid} />;
}

function Splash({ text }: { text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <Loader2 className="size-7 animate-spin" />
        <p>{text}</p>
      </div>
    </div>
  );
}

// ───────────── Beitreten: erst die Regeln, dann der Name ─────────────

function JoinFlow({
  code,
  videoUrl,
  notice,
  onJoined,
}: {
  code: string;
  videoUrl: string | null;
  notice: string | null;
  onJoined: (token: string) => void;
}) {
  const [info, setInfo] = useState<PublicGameInfo | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(() => !store.introSeen());
  const [name, setName] = useState(() => store.name());
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<PublicGameInfo>(`/games/${code}`, { method: "GET" })
      .then((data) => !cancelled && setInfo(data))
      .catch((err) => !cancelled && setMissing(err instanceof Error ? err.message : "Fehler"));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (missing) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="display text-4xl">Kein Spiel gefunden</p>
          <p className="mt-3 text-zinc-400">{missing}</p>
          <Link href="/fangen" className="mt-6 inline-block font-bold text-lime-400 underline underline-offset-4">
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }
  if (!info) return <Splash text="Spiel wird gesucht …" />;

  if (showIntro) {
    return (
      <Intro
        videoUrl={videoUrl}
        doneLabel="Verstanden, ich bin dabei"
        onDone={() => {
          store.setIntroSeen();
          setShowIntro(false);
        }}
      />
    );
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value || joining) return;
    setJoining(true);
    setError(null);
    try {
      const res = await api<{ token: string }>(`/games/${code}/join`, {
        body: { name: value, introSeen: true },
      });
      store.setName(value);
      onJoined(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beitreten hat nicht geklappt.");
      setJoining(false);
    }
  }

  const over = info.status === "FINISHED";

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <div className="vest-stripes -mx-5 h-1.5" aria-hidden />
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
          {info.hostName ? `${info.hostName} lädt dich ein` : "Du bist eingeladen"}
        </p>
        <h1 className="display mt-3 break-words text-5xl">{info.name}</h1>
        <p className="mt-4 text-zinc-400">
          {over
            ? "Dieses Spiel ist schon vorbei."
            : info.status === "RUNNING"
              ? `Das Spiel läuft schon. Du kannst als Läufer nachträglich einsteigen. ${info.playerCount} sind dabei.`
              : `${info.playerCount} ${info.playerCount === 1 ? "ist" : "sind"} schon in der Lobby.`}
        </p>

        {notice && (
          <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {notice}
          </p>
        )}

        {!over && (
          <form onSubmit={join} className="mt-8">
            <label htmlFor="fangen-name" className="text-sm font-bold text-zinc-300">
              Dein Name im Spiel
            </label>
            <input
              id="fangen-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIMITS.nameLength}
              autoComplete="nickname"
              autoFocus
              placeholder="z. B. Leon"
              className="mt-2 min-h-14 w-full rounded-2xl border border-white/15 bg-zinc-900 px-4 text-lg text-white outline-none placeholder:text-zinc-600 focus:border-lime-400"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" className="mt-4 w-full" disabled={!name.trim() || joining}>
              {joining ? "Moment …" : "Mitspielen"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setShowIntro(true)}
          className="mt-6 inline-flex items-center gap-2 self-start text-sm font-bold text-zinc-400 underline underline-offset-4"
        >
          <BookOpen className="size-4" /> Regeln nochmal ansehen
        </button>
      </div>
    </main>
  );
}

// ───────────── Im Spiel: Standort melden, Spielstand holen ─────────────

function Session({
  code,
  token,
  videoUrl,
  onInvalid,
}: {
  code: string;
  token: string;
  videoUrl: string | null;
  onInvalid: (message: string) => void;
}) {
  const { fix, error: geoError } = useGeolocation();
  const [state, setState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [offline, setOffline] = useState(false);
  const [offset, setOffset] = useState(0);

  const fixRef = useRef<Fix | null>(null);
  const cursorRef = useRef(0);
  const roleRef = useRef<PlayerRole | null>(null);
  const busyRef = useRef(false);
  const againRef = useRef(false);

  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);

  const sync = useCallback(async () => {
    if (busyRef.current) {
      againRef.current = true;
      return;
    }
    busyRef.current = true;
    try {
      do {
        againRef.current = false;
        const current = fixRef.current;
        const fresh = current && Date.now() - current.at < 30_000 ? current : null;
        const next = await api<GameState>(`/games/${code}/sync`, {
          token,
          body: {
            lat: fresh?.lat,
            lng: fresh?.lng,
            accuracy: fresh?.accuracy,
            afterMessageId: cursorRef.current,
          },
        });
        const me = next.players.find((p) => p.id === next.meId);
        if (!me) throw new ApiError(401, "Du bist nicht mehr in diesem Spiel.");

        setOffline(false);
        setOffset(next.serverNow - Date.now());
        setState(next);

        if (roleRef.current !== null && roleRef.current !== me.role) {
          // Rolle gewechselt: ab jetzt gehört der Fänger Chat dazu. Verlauf komplett neu holen.
          roleRef.current = me.role;
          cursorRef.current = 0;
          setMessages([]);
          againRef.current = true;
          continue;
        }
        roleRef.current = me.role;
        if (next.messages.length > 0) {
          cursorRef.current = next.messages[next.messages.length - 1].id;
          setMessages((prev) => [...prev, ...next.messages]);
        }
      } while (againRef.current);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        onInvalid("Du bist nicht mehr in diesem Spiel. Wenn das ein Versehen war, tritt einfach neu bei.");
      } else {
        setOffline(true);
      }
    } finally {
      busyRef.current = false;
    }
  }, [code, token, onInvalid]);

  useEffect(() => {
    const first = window.setTimeout(sync, 0);
    const id = window.setInterval(sync, SYNC_MS);
    const onVisible = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);

  const act = useCallback(
    async (type: string, extra: Record<string, unknown> = {}) => {
      await api(`/games/${code}/action`, { token, body: { type, ...extra } });
      await sync();
    },
    [code, token, sync]
  );

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      await api(`/games/${code}`, { method: "PATCH", token, body });
      await sync();
    },
    [code, token, sync]
  );

  const sendChat = useCallback(
    async (channel: Channel, text: string) => {
      await api(`/games/${code}/chat`, { token, body: { channel, text } });
      await sync();
    },
    [code, token, sync]
  );

  const now = useNow(offset);

  const me = state?.players.find((p) => p.id === state.meId);
  if (!state || !me) return <Splash text="Verbinde mit dem Spiel …" />;

  const props: SessionProps = {
    code,
    state,
    me,
    now,
    fix,
    geoError,
    messages,
    offline,
    videoUrl,
    act,
    patch,
    sendChat,
  };

  if (state.game.status === "LOBBY") return <Lobby {...props} />;
  if (state.game.status === "RUNNING") return <Running {...props} />;
  return <Finished {...props} />;
}
