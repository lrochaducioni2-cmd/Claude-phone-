import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exEquipmentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exEquipment.findFirst({
    where: { id, area: { facility: { ownerId: userId } } },
    include: { area: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exEquipmentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Só permite mover o equipamento para outra área da mesma instalação.
  if (data.areaId && data.areaId !== existing.areaId) {
    const area = await prisma.exArea.findFirst({
      where: { id: data.areaId, facilityId: existing.area.facilityId },
    });
    if (!area) {
      return NextResponse.json({ error: "Área não encontrada." }, { status: 400 });
    }
  }

  const equipment = await prisma.exEquipment.update({
    where: { id },
    data: {
      ...(data.areaId !== undefined && { areaId: data.areaId }),
      ...(data.tag !== undefined && { tag: data.tag }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer || null }),
      ...(data.model !== undefined && { model: data.model || null }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber || null }),
      ...(data.marking !== undefined && { marking: data.marking || null }),
      ...(body && "protectionTypes" in body && { protectionTypes: data.protectionTypes }),
      ...(data.group !== undefined && { group: data.group || null }),
      ...(data.temperatureClass !== undefined && { temperatureClass: data.temperatureClass || null }),
      ...(body && "maxSurfaceTempC" in body && { maxSurfaceTempC: data.maxSurfaceTempC }),
      ...(data.epl !== undefined && { epl: data.epl || null }),
      ...(data.ipRating !== undefined && { ipRating: data.ipRating || null }),
      ...(data.certificateNumber !== undefined && { certificateNumber: data.certificateNumber || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  });

  return NextResponse.json(equipment);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exEquipment.findFirst({
    where: { id, area: { facility: { ownerId: userId } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
  }

  await prisma.exEquipment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
