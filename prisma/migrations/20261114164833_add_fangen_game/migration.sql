-- Nur die Tabellen für das Fangen Spiel (/fangen).
-- Hinweis: BillingDocument und WiderrufRequest stehen im Schema, haben aber keine
-- Migration (vermutlich per db push angelegt) und sind hier bewusst nicht enthalten.

-- CreateEnum
CREATE TYPE "public"."TagGameStatus" AS ENUM ('LOBBY', 'RUNNING', 'FINISHED');

-- CreateEnum
CREATE TYPE "public"."TagPlayerRole" AS ENUM ('RUNNER', 'CATCHER');

-- CreateEnum
CREATE TYPE "public"."TagChannel" AS ENUM ('ALL', 'CATCHERS');

-- CreateTable
CREATE TABLE "public"."TagGame" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."TagGameStatus" NOT NULL DEFAULT 'LOBBY',
    "zone" JSONB NOT NULL DEFAULT '[]',
    "durationMinutes" INTEGER NOT NULL DEFAULT 240,
    "revealLastCount" INTEGER NOT NULL DEFAULT 3,
    "revealLastMinutes" INTEGER NOT NULL DEFAULT 30,
    "revealIntervalSec" INTEGER NOT NULL DEFAULT 300,
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "endgameStartedAt" TIMESTAMP(3),
    "lastRevealSlot" INTEGER NOT NULL DEFAULT -1,
    "finishedAt" TIMESTAMP(3),
    "winner" "public"."TagPlayerRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagPlayer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "public"."TagPlayerRole" NOT NULL DEFAULT 'RUNNER',
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "firstCatcher" BOOLEAN NOT NULL DEFAULT false,
    "introSeenAt" TIMESTAMP(3),
    "caughtAt" TIMESTAMP(3),
    "caughtById" TEXT,
    "vestAt" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "locationAt" TIMESTAMP(3),
    "outsideZone" BOOLEAN NOT NULL DEFAULT false,
    "revealLat" DOUBLE PRECISION,
    "revealLng" DOUBLE PRECISION,
    "revealAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagBox" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TagBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagMessage" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "channel" "public"."TagChannel" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TagEvent" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TagGame_code_key" ON "public"."TagGame"("code");

-- CreateIndex
CREATE INDEX "TagGame_createdAt_idx" ON "public"."TagGame"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TagPlayer_tokenHash_key" ON "public"."TagPlayer"("tokenHash");

-- CreateIndex
CREATE INDEX "TagPlayer_gameId_idx" ON "public"."TagPlayer"("gameId");

-- CreateIndex
CREATE INDEX "TagBox_gameId_idx" ON "public"."TagBox"("gameId");

-- CreateIndex
CREATE INDEX "TagMessage_gameId_id_idx" ON "public"."TagMessage"("gameId", "id");

-- CreateIndex
CREATE INDEX "TagEvent_gameId_id_idx" ON "public"."TagEvent"("gameId", "id");

-- AddForeignKey
ALTER TABLE "public"."TagPlayer" ADD CONSTRAINT "TagPlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."TagGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TagBox" ADD CONSTRAINT "TagBox_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."TagGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TagMessage" ADD CONSTRAINT "TagMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."TagGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TagMessage" ADD CONSTRAINT "TagMessage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."TagPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TagEvent" ADD CONSTRAINT "TagEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."TagGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
