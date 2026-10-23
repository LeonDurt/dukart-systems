import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token und Passwort erforderlich." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken) {
    return NextResponse.json({ error: "Ungültiger Link." }, { status: 404 });
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: "Link bereits verwendet." }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link abgelaufen." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
