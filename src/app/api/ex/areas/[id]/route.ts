import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exAreaUpdateSchema, isZoneValidForAtmosphere } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exArea.findFirst({ where: { id, facility: { ownerId: userId } } });
  if (!existing) {
    return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exAreaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, atmosphere, zone, group, temperatureClass, maxSurfaceTempC, notes } = parsed.data;

  if (!isZoneValidForAtmosphere(atmosphere ?? existing.atmosphere, zone ?? existing.zone)) {
    return NextResponse.json(
      { error: "Zona incompatível com o tipo de atmosfera." },
      { status: 400 },
    );
  }

  const area = await prisma.exArea.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(atmosphere !== undefined && { atmosphere }),
      ...(zone !== undefined && { zone }),
      ...(group !== undefined && { group: group || null }),
      ...(temperatureClass !== undefined && { temperatureClass: temperatureClass || null }),
      ...(body && "maxSurfaceTempC" in body && { maxSurfaceTempC }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(area);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exArea.findFirst({ where: { id, facility: { ownerId: userId } } });
  if (!existing) {
    return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
  }

  await prisma.exArea.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
