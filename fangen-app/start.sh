#!/bin/sh
# Startet FANGEN auf Mac und Linux. Unter Windows: START.bat doppelklicken.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js fehlt. Installiere es von https://nodejs.org und starte dieses Skript danach erneut."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Erster Start: Die App wird eingerichtet. Das dauert ein paar Minuten ..."
  npm install || exit 1
fi

echo "Die App wird vorbereitet ..."
npm run build || exit 1

echo
echo "FANGEN läuft unter http://localhost:3000"
echo "Dieses Fenster offen lassen. Zum Beenden: Strg + C."
echo
# Browser kurz nach dem Serverstart öffnen
(sleep 3; (open http://localhost:3000 || xdg-open http://localhost:3000) >/dev/null 2>&1) &
npm run start
