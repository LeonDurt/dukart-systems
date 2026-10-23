import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// PATCH: Mitarbeiter bearbeiten (Rolle, Status, Passwort reset)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur Admins können Mitarbeiter bearbeiten." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive, role, displayName, position, newPassword } = body;

  // Eigenen Account kann man nicht deaktivieren
  if (id === session.user.id && isActive === false) {
    return NextResponse.json({ error: "Du kannst deinen eigenen Account nicht deaktivieren." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (role !== undefined) updates.role = role;

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }
    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const profileUpdates: Record<string, unknown> = {};
  if (displayName !== undefined) profileUpdates.displayName = displayName;
  if (position !== undefined) profileUpdates.position = position || null;

  await prisma.user.update({
    where: { id },
    data: {
      ...updates,
      ...(Object.keys(profileUpdates).length > 0 && {
        staffProfile: { update: profileUpdates },
      }),
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE: Mitarbeiter löschen (nur ADMIN, nicht sich selbst)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Du kannst deinen eigenen Account nicht löschen." }, { status: 400 });
  }

  // Erst StaffProfile löschen (FK), dann User
  await prisma.staffProfile.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
