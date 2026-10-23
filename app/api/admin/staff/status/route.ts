import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { StaffStatus } from "@prisma/client";

// GET: alle Mitarbeiter mit ihrem Status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "STAFF" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const staff = await prisma.staffProfile.findMany({
    include: {
      user: { select: { id: true, email: true, role: true, isActive: true } },
    },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json({ staff });
}

// PATCH: eigenen Status setzen
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "STAFF" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { status } = await req.json();
  const validStatuses: StaffStatus[] = ["AVAILABLE", "BUSY", "BREAK", "OFFLINE"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  const profile = await prisma.staffProfile.upsert({
    where: { userId: session.user!.id },
    update: { status },
    create: {
      userId: session.user!.id,
      displayName: session.user!.email ?? "Mitarbeiter",
      status,
    },
  });

  return NextResponse.json({ status: profile.status });
}
