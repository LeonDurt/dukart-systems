import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import { normalizeCode, publicInfo } from "@/lib/server";
import GameLoader from "../../_components/GameLoader";

type Props = { params: Promise<{ code: string }> };

// Damit der Einladungslink im Messenger gleich zeigt, worum es geht.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const info = publicInfo(code);
  if (!info) return { title: "Spiel nicht gefunden" };
  const description = info.hostName
    ? `${info.hostName} lädt dich zu einer Runde Fangen ein. Bist du dabei?`
    : "Du bist zu einer Runde Fangen eingeladen. Bist du dabei?";
  return { title: info.name, description, openGraph: { title: `${info.name} · FANGEN`, description } };
}

/**
 * Erklärvideo: einfach eine Datei public/erklaervideo.mp4 ablegen, dann läuft sie
 * vor den Regeln. Alternativ eine Adresse über FANGEN_VIDEO_URL setzen.
 */
function introVideo(): string | null {
  if (process.env.FANGEN_VIDEO_URL) return process.env.FANGEN_VIDEO_URL;
  return existsSync(path.join(process.cwd(), "public", "erklaervideo.mp4")) ? "/erklaervideo.mp4" : null;
}

export default async function GamePage({ params }: Props) {
  const { code } = await params;
  return <GameLoader code={normalizeCode(code)} videoUrl={introVideo()} />;
}
