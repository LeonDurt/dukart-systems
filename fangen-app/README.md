# FANGEN. Das Stadtspiel

Fangen in einer festgelegten Zone, bis zu vier Stunden, mit Livekarte auf dem Handy.
Die App läuft komplett auf deinem eigenen Computer: keine Datenbank, kein Konto, kein Server im Netz nötig.

## Starten

Einmalig brauchst du [Node.js](https://nodejs.org) (Version 20 oder neuer).

- **Windows:** `START.bat` doppelklicken
- **Mac oder Linux:** im Terminal `./start.sh` ausführen

Beim ersten Start richtet sich die App ein, das dauert ein paar Minuten. Danach öffnet sich
der Browser mit `http://localhost:3000`. Das schwarze Fenster muss offen bleiben, solange gespielt wird.

## Allein ausprobieren

Ein Spiel braucht mindestens zwei Leute. Zum Testen kannst du mehrere Spieler in einem Browser simulieren:

1. Auf der Startseite „Spiel aufmachen“. Du bist jetzt Host und siehst den Spielcode, zum Beispiel `K7XQ2`.
2. Neuen Tab öffnen: `http://localhost:3000/spiel/K7XQ2?geraet=2`
3. Für einen dritten Spieler noch ein Tab mit `?geraet=3`, und so weiter.

Jeder Tab mit eigener Nummer verhält sich wie ein eigenes Handy. Als Spieldauer gibt es in der Lobby
„10 Minuten (Testrunde)“.

Hinweis: Ein Computer ohne GPS kennt seinen Standort nur ungefähr. Zum Durchklicken reicht das.
Die Kiste lässt sich im Test am einfachsten direkt neben deinen eigenen Punkt setzen, sonst kann der
Host das Leibchen in der Spielerliste bestätigen.

## Mit Freunden draußen spielen

Dafür müssen die Handys deiner Freunde deinen Computer erreichen, und zwar über eine sichere Adresse
(`https`). Ohne die gibt ein Handy seinen Standort nicht frei. Die Adresse `localhost` funktioniert nur
auf deinem eigenen Computer.

Der einfachste Weg ohne eigene Domain ist ein Tunnel:

1. [cloudflared](https://github.com/cloudflare/cloudflared/releases) installieren (unter Windows geht auch `winget install --id Cloudflare.cloudflared`)
2. FANGEN starten wie oben
3. In einem zweiten Terminal: `cloudflared tunnel --url http://localhost:3000`
4. Die angezeigte Adresse (endet auf `trycloudflare.com`) öffnen, dort das Spiel aufmachen und den Link teilen

Der Computer muss während des ganzen Spiels an bleiben und online sein. Die Tunnel Adresse ändert sich bei
jedem Start.

## Erklärvideo

Lege ein Video als `public/erklaervideo.mp4` ab und starte die App neu. Es läuft dann vor den Regeln,
wenn jemand zum ersten Mal einen Einladungslink öffnet. Ohne Video läuft nur die Regel Story.

## Spielstand

Der Spielstand liegt im Arbeitsspeicher und wird nebenbei in `data/spiele.json` gesichert. Ein Neustart
mitten im Spiel ist deshalb kein Problem. Um alles zurückzusetzen: App beenden und den Ordner `data` löschen.
Spiele, die älter als 14 Tage sind, werden automatisch entfernt. Standorte werden nach Spielende gelöscht.

## Bekannte Grenzen

- Ein Browser meldet den Standort nur, solange die Seite offen und der Bildschirm an ist. Die App hält den
  Bildschirm deshalb wach. Für Standort im Hintergrund braucht es später eine echte App aus dem Store.
- Das Fangen meldet jeder selbst. Der Host kann in der Spielerliste nachtragen.
- Die Karte kommt von OpenStreetMap. Für sehr viele Spieler sollte später ein eigener Kartenanbieter
  eingetragen werden (`app/_components/GameMap.tsx`).

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `app/page.tsx` | Startseite |
| `app/spiel/[code]` | Lobby, Spiel und Auswertung |
| `app/_components` | Oberfläche: Karte, Chat, Regeln, Spielansichten |
| `app/api/games` | Schnittstelle: anlegen, beitreten, `sync`, `action`, `chat` |
| `lib/server.ts` | Spieluhr, Signal, wer wessen Standort sehen darf |
| `lib/store.ts` | Spielstand im Arbeitsspeicher mit Sicherung auf Platte |
| `lib/geo.ts` | Abstände, Zone, nächste Kiste |
