import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BUILDS } from "@/lib/configurator-defaults";

// GET: alle Builds laden (oder Standardwerte wenn leer)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const rows = await prisma.configuratorBuild.findMany({ orderBy: [{ useCase: "asc" }, { budget: "asc" }] });
  return NextResponse.json(rows);
}

// POST: einen einzelnen Build speichern (upsert)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json();
  const { useCase, budget, cpu, gpu, ram, storage, cooling, pcCase, psu, priceRange, servicePrice, note } = body;

  if (!useCase || !budget) {
    return NextResponse.json({ error: "useCase und budget erforderlich." }, { status: 400 });
  }

  const saved = await prisma.configuratorBuild.upsert({
    where: { useCase_budget: { useCase, budget } },
    update: { cpu, gpu, ram, storage, cooling, pcCase, psu, priceRange, servicePrice, note },
    create: { useCase, budget, cpu, gpu, ram, storage, cooling, pcCase, psu, priceRange, servicePrice, note },
  });

  return NextResponse.json(saved);
}

// PUT: Alle Standardwerte in die DB laden
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const ops = [];
  for (const [useCase, budgets] of Object.entries(DEFAULT_BUILDS)) {
    for (const [budget, data] of Object.entries(budgets)) {
      ops.push(
        prisma.configuratorBuild.upsert({
          where: { useCase_budget: { useCase, budget } },
          update: { ...data },
          create: { useCase, budget, ...data },
        })
      );
    }
  }
  await Promise.all(ops);
  return NextResponse.json({ success: true, count: ops.length });
}
