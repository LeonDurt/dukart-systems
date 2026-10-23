import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token und Passwort erforderlich." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: { customer: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Ungültiger Einladungslink." }, { status: 404 });
    }

    if (invitation.usedAt) {
      return NextResponse.json({ error: "Dieser Link wurde bereits verwendet. Bitte melde dich unter /login an." }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Einladungslink abgelaufen. Bitte fordere einen neuen an." }, { status: 400 });
    }

    // Kunde hat bereits einen verknüpften Account → einfach einloggen
    if (invitation.customer.userId) {
      return NextResponse.json({ error: "Account bereits vorhanden. Bitte melde dich unter /login an." }, { status: 400 });
    }

    const email = (invitation.customer.email && invitation.customer.email.trim())
      ? invitation.customer.email.trim()
      : invitation.email.trim();

    const passwordHash = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    await prisma.$transaction(async (tx) => {
      let userId: string;

      if (existingUser) {
        // User existiert schon (z.B. Testaccount) → Passwort aktualisieren + auf CUSTOMER setzen
        await tx.user.update({
          where: { id: existingUser.id },
          data: { passwordHash, role: "CUSTOMER", isActive: true },
        });
        userId = existingUser.id;
      } else {
        // Neuen User erstellen
        const newUser = await tx.user.create({
          data: { email, passwordHash, role: "CUSTOMER", isActive: true },
        });
        userId = newUser.id;
      }

      await tx.customer.update({
        where: { id: invitation.customer.id },
        data: { userId },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json({ error: "Interner Fehler." }, { status: 500 });
  }
}
