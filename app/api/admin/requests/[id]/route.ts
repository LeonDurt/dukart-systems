import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPERVISOR")) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;

  const request = await prisma.contactRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  await prisma.contactRequest.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
