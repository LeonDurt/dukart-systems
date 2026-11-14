"use client";

import dynamic from "next/dynamic";

// Das Spiel hängt an localStorage (Geräte-Token) und GPS, beides gibt es nur im Browser.
const GameClient = dynamic(() => import("./GameClient"), { ssr: false });

export default function GameLoader(props: { code: string; videoUrl: string | null }) {
  return <GameClient {...props} />;
}
