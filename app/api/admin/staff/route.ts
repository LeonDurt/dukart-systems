import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET: alle Mitarbeiter
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERVISOR", "STAFF"] } },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      staffProfile: { select: { displayName: true, position: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(staff);
}

// POST: neuen Mitarbeiter anlegen (nur ADMIN)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur Admins können Mitarbeiter anlegen." }, { status: 403 });
  }

  const { email, password, displayName, position, role } = await req.json();

  if (!email || !password || !displayName || !role) {
    return NextResponse.json({ error: "E-Mail, Passwort, Name und Rolle erforderlich." }, { status: 400 });
  }

  if (!["STAFF", "SUPERVISOR", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-Mail wird bereits verwendet." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      isActive: true,
      staffProfile: {
        create: { displayName, position: position || null },
      },
    },
    include: { staffProfile: true },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.staffProfile?.displayName,
  });
}
