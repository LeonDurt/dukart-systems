import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  return !!session && (role === "ADMIN" || role === "SUPERVISOR");
}

// PATCH: Freischalten / Ablehnen
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;
  const { isApproved } = await req.json();

  const review = await prisma.review.update({
    where: { id },
    data: { isApproved },
  });

  return NextResponse.json(review);
}

// DELETE: Bewertung löschen
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
