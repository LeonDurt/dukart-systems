@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FANGEN

where node >nul 2>nul
if errorlevel 1 goto :keinnode

if exist node_modules goto :bauen
echo Erster Start: Die App wird eingerichtet. Das dauert ein paar Minuten ...
call npm install
if errorlevel 1 goto :fehler

:bauen
echo Die App wird vorbereitet ...
call npm run build
if errorlevel 1 goto :fehler

echo.
echo ============================================================
echo   FANGEN läuft unter  http://localhost:3000
echo   Dieses Fenster offen lassen. Zum Beenden einfach schließen.
echo ============================================================
echo.
rem Browser kurz nach dem Serverstart öffnen
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:3000"
call npm run start
goto :eof

:keinnode
echo Node.js fehlt auf diesem Computer.
echo Installiere es von https://nodejs.org und starte diese Datei danach erneut.
pause
exit /b 1

:fehler
echo.
echo Da ist etwas schiefgelaufen. Die Meldung steht weiter oben.
pause
exit /b 1
