import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET: Profil-Daten
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user!.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      customer: {
        select: { firstName: true, lastName: true, customerNumber: true, phone: true, email: true },
      },
      staffProfile: {
        select: { displayName: true, position: true },
      },
    },
  });

  return NextResponse.json(user);
}

// PATCH: Passwort ändern
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Aktuelles und neues Passwort erforderlich." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Neues Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user!.id } });
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Aktuelles Passwort ist falsch." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ success: true });
}
