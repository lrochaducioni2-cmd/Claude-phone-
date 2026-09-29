import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exAreaSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { facilityId, name, atmosphere, zone, group, temperatureClass, maxSurfaceTempC, notes } =
    parsed.data;

  const facility = await prisma.exFacility.findFirst({ where: { id: facilityId, ownerId: userId } });
  if (!facility) {
    return NextResponse.json({ error: "Instalação não encontrada." }, { status: 404 });
  }

  const area = await prisma.exArea.create({
    data: {
      facilityId,
      name,
      atmosphere,
      zone,
      group: group || null,
      temperatureClass: temperatureClass || null,
      maxSurfaceTempC,
      notes: notes || null,
    },
  });

  return NextResponse.json(area, { status: 201 });
}
