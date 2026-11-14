import type { Metadata } from "next";
import { normalizeCode, publicInfo } from "@/lib/fangen/server";
import GameLoader from "../_components/GameLoader";

type Props = { params: Promise<{ code: string }> };

// Damit der Einladungslink im Messenger gleich zeigt, worum es geht.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const info = await publicInfo(code).catch(() => null);
  if (!info) return { title: "Spiel nicht gefunden" };
  const description = info.hostName
    ? `${info.hostName} lädt dich zu einer Runde Fangen ein. Bist du dabei?`
    : "Du bist zu einer Runde Fangen eingeladen. Bist du dabei?";
  return { title: info.name, description, openGraph: { title: `${info.name} · FANGEN`, description } };
}

export default async function GamePage({ params }: Props) {
  const { code } = await params;
  return <GameLoader code={normalizeCode(code)} videoUrl={process.env.FANGEN_VIDEO_URL ?? null} />;
}
