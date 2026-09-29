import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exEquipmentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const area = await prisma.exArea.findFirst({
    where: { id: data.areaId, facility: { ownerId: userId } },
  });
  if (!area) {
    return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
  }

  const equipment = await prisma.exEquipment.create({
    data: {
      areaId: data.areaId,
      tag: data.tag,
      description: data.description,
      manufacturer: data.manufacturer || null,
      model: data.model || null,
      serialNumber: data.serialNumber || null,
      marking: data.marking || null,
      protectionTypes: data.protectionTypes,
      group: data.group || null,
      temperatureClass: data.temperatureClass || null,
      maxSurfaceTempC: data.maxSurfaceTempC,
      epl: data.epl || null,
      ipRating: data.ipRating || null,
      certificateNumber: data.certificateNumber || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
