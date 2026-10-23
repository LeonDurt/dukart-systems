import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BUILDS } from "@/lib/configurator-defaults";

export async function GET() {
  const rows = await prisma.configuratorBuild.findMany();

  // Wenn noch nichts in der DB: Standardwerte zurückgeben
  if (rows.length === 0) {
    return NextResponse.json(DEFAULT_BUILDS);
  }

  // DB-Daten in verschachteltes Objekt umwandeln
  const result: Record<string, Record<string, object>> = {};
  for (const row of rows) {
    if (!result[row.useCase]) result[row.useCase] = {};
    result[row.useCase][row.budget] = {
      cpu: row.cpu,
      gpu: row.gpu,
      ram: row.ram,
      storage: row.storage,
      cooling: row.cooling,
      pcCase: row.pcCase,
      psu: row.psu,
      priceRange: row.priceRange,
      servicePrice: row.servicePrice,
      note: row.note,
    };
  }

  return NextResponse.json(result);
}
