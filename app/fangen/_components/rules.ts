import {
  Clock,
  DoorClosed,
  MapPinned,
  MessagesSquare,
  Package,
  Radio,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export type Rule = { icon: LucideIcon; title: string; text: string };

// Eine Quelle für das Intro beim ersten Öffnen und für den Regeln Tab im Spiel.
export const RULES: Rule[] = [
  {
    icon: Clock,
    title: "Vier Stunden. Einer fängt.",
    text: "Am Anfang gibt es einen Fänger. Alle anderen laufen. Wer nach Ablauf der Zeit noch frei ist, gewinnt.",
  },
  {
    icon: MapPinned,
    title: "Bleib in der Zone",
    text: "Die Karte zeigt dir die Spielzone. Verlässt du sie, schlägt die App Alarm und alle bekommen es mit.",
  },
  {
    icon: Shirt,
    title: "Fänger tragen Leibchen",
    text: "Am Leibchen erkennst du, wer fängt. Nur wer eins trägt, darf fangen. Ein Antippen reicht.",
  },
  {
    icon: Package,
    title: "Gefangen? Ab zur Kiste",
    text: "Tippe auf „Ich wurde gefangen“. Die App zeigt dir die nächste Kiste. Geh auf direktem Weg hin und zieh ein Leibchen an. Ab dann fängst du mit.",
  },
  {
    icon: MessagesSquare,
    title: "Der Fänger Chat",
    text: "Sobald du gefangen bist, landest du im Chat der Fänger. Dort seht ihr euch gegenseitig auf der Karte und sprecht euch ab.",
  },
  {
    icon: DoorClosed,
    title: "Draußen bleiben",
    text: "Verstecken in Häusern, Hausfluren, Läden und auf Privatgrundstücken ist verboten. Achte auf den Verkehr. Kein Spiel ist eine rote Ampel wert.",
  },
  {
    icon: Radio,
    title: "Das Signal",
    text: "Sind nur noch wenige frei oder läuft die Zeit ab, sendet die App alle paar Minuten den Standort der letzten Läufer an die Fänger.",
  },
];
